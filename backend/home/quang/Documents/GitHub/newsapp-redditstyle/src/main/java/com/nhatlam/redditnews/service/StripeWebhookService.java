package com.nhatlam.redditnews.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.exception.BadRequestException;
import com.nhatlam.redditnews.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StripeWebhookService {

    private static final long SIGNATURE_TOLERANCE_SECONDS = 300;

    private final UserRepository userRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.billing.stripe.webhook-secret:}")
    private String webhookSecret;

    public void handle(String payload, String signatureHeader) {
        verifySignature(payload, signatureHeader);
        JsonNode event = parsePayload(payload);
        String type = event.path("type").asText("");
        JsonNode object = event.path("data").path("object");

        switch (type) {
            case "checkout.session.completed" -> handleCheckoutSessionCompleted(object);
            case "customer.subscription.updated" -> handleSubscriptionUpdated(object);
            case "customer.subscription.deleted" -> handleSubscriptionDeleted(object);
            default -> {
                // Acknowledge unhandled events so Stripe does not retry them.
            }
        }
    }

    private void handleCheckoutSessionCompleted(JsonNode session) {
        if (!"subscription".equals(session.path("mode").asText())) {
            return;
        }
        if (!"complete".equals(session.path("status").asText()) || !isPaid(session.path("payment_status").asText())) {
            return;
        }

        Long userId = resolveUserId(session)
                .orElseThrow(() -> new BadRequestException("Stripe session is missing user identity."));
        userService.applyStripeSubscription(
                userId,
                metadata(session, "plan"),
                metadata(session, "billing_cadence"),
                "active",
                textOrNull(session, "customer"),
                textOrNull(session, "subscription"));
    }

    private void handleSubscriptionUpdated(JsonNode subscription) {
        String status = subscription.path("status").asText("");
        Long userId = resolveUserId(subscription)
                .orElseThrow(() -> new BadRequestException("Stripe subscription is missing user identity."));
        userService.applyStripeSubscription(
                userId,
                metadata(subscription, "plan"),
                metadata(subscription, "billing_cadence"),
                status,
                textOrNull(subscription, "customer"),
                textOrNull(subscription, "id"));
    }

    private void handleSubscriptionDeleted(JsonNode subscription) {
        Long userId = resolveUserId(subscription)
                .orElseThrow(() -> new BadRequestException("Stripe subscription is missing user identity."));
        userService.applyStripeSubscription(
                userId,
                "FREE",
                "MONTHLY",
                "canceled",
                textOrNull(subscription, "customer"),
                textOrNull(subscription, "id"));
    }

    private Optional<Long> resolveUserId(JsonNode object) {
        String metadataUserId = metadataOrNull(object, "user_id");
        if (metadataUserId != null) {
            try {
                return Optional.of(Long.parseLong(metadataUserId));
            } catch (NumberFormatException ignored) {
                throw new BadRequestException("Stripe metadata user_id is invalid.");
            }
        }

        String clientReferenceId = textOrNull(object, "client_reference_id");
        if (clientReferenceId != null) {
            try {
                return Optional.of(Long.parseLong(clientReferenceId));
            } catch (NumberFormatException ignored) {
                throw new BadRequestException("Stripe client_reference_id is invalid.");
            }
        }

        String subscriptionId = textOrNull(object, "id");
        if (subscriptionId != null) {
            Optional<User> user = userRepository.findByStripeSubscriptionId(subscriptionId);
            if (user.isPresent()) {
                return user.map(User::getId);
            }
        }

        String customerId = textOrNull(object, "customer");
        if (customerId != null) {
            return userRepository.findByStripeCustomerId(customerId).map(User::getId);
        }

        return Optional.empty();
    }

    private void verifySignature(String payload, String signatureHeader) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            throw new BadRequestException("Stripe webhook secret is not configured.");
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            throw new BadRequestException("Missing Stripe signature.");
        }

        String timestamp = signaturePart(signatureHeader, "t")
                .orElseThrow(() -> new BadRequestException("Missing Stripe signature timestamp."));
        long timestampSeconds;
        try {
            timestampSeconds = Long.parseLong(timestamp);
        } catch (NumberFormatException error) {
            throw new BadRequestException("Invalid Stripe signature timestamp.");
        }
        if (Math.abs(Instant.now().getEpochSecond() - timestampSeconds) > SIGNATURE_TOLERANCE_SECONDS) {
            throw new BadRequestException("Stripe webhook timestamp is outside tolerance.");
        }

        String signedPayload = timestamp + "." + payload;
        String expectedSignature = hmacSha256Hex(signedPayload, webhookSecret);
        boolean signatureMatches = Arrays.stream(signatureHeader.split(","))
                .filter(part -> part.startsWith("v1="))
                .map(part -> part.substring(3))
                .anyMatch(signature -> secureEquals(signature, expectedSignature));

        if (!signatureMatches) {
            throw new BadRequestException("Stripe webhook signature verification failed.");
        }
    }

    private Optional<String> signaturePart(String signatureHeader, String key) {
        return Arrays.stream(signatureHeader.split(","))
                .filter(part -> part.startsWith(key + "="))
                .map(part -> part.substring(key.length() + 1))
                .findFirst();
    }

    private String hmacSha256Hex(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte value : digest) {
                hex.append(String.format("%02x", value));
            }
            return hex.toString();
        } catch (Exception error) {
            throw new BadRequestException("Stripe webhook signature verification failed.");
        }
    }

    private boolean secureEquals(String left, String right) {
        return java.security.MessageDigest.isEqual(
                left.getBytes(StandardCharsets.UTF_8),
                right.getBytes(StandardCharsets.UTF_8));
    }

    private JsonNode parsePayload(String payload) {
        try {
            return objectMapper.readTree(payload);
        } catch (Exception error) {
            throw new BadRequestException("Stripe webhook payload is invalid.");
        }
    }

    private boolean isPaid(String paymentStatus) {
        return "paid".equals(paymentStatus) || "no_payment_required".equals(paymentStatus);
    }

    private String metadata(JsonNode object, String key) {
        String value = metadataOrNull(object, key);
        if (value == null) {
            throw new BadRequestException("Stripe metadata is missing " + key + ".");
        }
        return value;
    }

    private String metadataOrNull(JsonNode object, String key) {
        JsonNode value = object.path("metadata").path(key);
        return value.isMissingNode() || value.asText().isBlank() ? null : value.asText();
    }

    private String textOrNull(JsonNode object, String key) {
        JsonNode value = object.path(key);
        return value.isMissingNode() || value.asText().isBlank() ? null : value.asText();
    }
}
