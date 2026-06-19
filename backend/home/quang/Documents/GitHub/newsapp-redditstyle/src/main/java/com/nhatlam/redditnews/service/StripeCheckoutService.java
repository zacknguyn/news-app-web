package com.nhatlam.redditnews.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nhatlam.redditnews.dto.request.StripeCheckoutCreateDTO;
import com.nhatlam.redditnews.dto.response.StripeCheckoutSessionDTO;
import com.nhatlam.redditnews.dto.response.StripePortalSessionDTO;
import com.nhatlam.redditnews.dto.response.UserDTO;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.exception.BadRequestException;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class StripeCheckoutService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final ObjectMapper objectMapper = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Value("${app.billing.stripe.enabled:false}")
    private boolean enabled;

    @Value("${app.billing.stripe.secret-key:}")
    private String secretKey;

    @Value("${app.billing.stripe.api-base:https://api.stripe.com}")
    private String apiBase;

    @Value("${app.billing.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.billing.stripe.price-ids.reader-plus.monthly:}")
    private String readerPlusMonthlyPriceId;

    @Value("${app.billing.stripe.price-ids.reader-plus.annual:}")
    private String readerPlusAnnualPriceId;

    @Value("${app.billing.stripe.price-ids.backer.monthly:}")
    private String backerMonthlyPriceId;

    @Value("${app.billing.stripe.price-ids.backer.annual:}")
    private String backerAnnualPriceId;

    @Value("${app.billing.stripe.price-ids.newsroom-pro.monthly:}")
    private String newsroomProMonthlyPriceId;

    @Value("${app.billing.stripe.price-ids.newsroom-pro.annual:}")
    private String newsroomProAnnualPriceId;

    public StripeCheckoutSessionDTO createSession(Long userId, StripeCheckoutCreateDTO dto) {
        ensureEnabled();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        String plan = normalizePlan(dto.getPlan());
        String cadence = normalizeCadence(dto.getBillingCadence());
        String priceId = priceIdFor(plan, cadence);

        List<String[]> fields = new ArrayList<>();
        fields.add(field("mode", "subscription"));
        fields.add(field("client_reference_id", String.valueOf(userId)));
        fields.add(field("customer_email", user.getEmail()));
        fields.add(field("line_items[0][price]", priceId));
        fields.add(field("line_items[0][quantity]", "1"));
        fields.add(field("success_url", frontendUrl + "/app/subscribe?stripe=success&session_id={CHECKOUT_SESSION_ID}"));
        fields.add(field("cancel_url", frontendUrl + "/app/subscribe?stripe=cancel"));
        fields.add(field("metadata[user_id]", String.valueOf(userId)));
        fields.add(field("metadata[plan]", plan));
        fields.add(field("metadata[billing_cadence]", cadence));
        fields.add(field("subscription_data[metadata][user_id]", String.valueOf(userId)));
        fields.add(field("subscription_data[metadata][plan]", plan));
        fields.add(field("subscription_data[metadata][billing_cadence]", cadence));

        StripeSessionResponse response = postForm("/v1/checkout/sessions", fields);
        if (response.url() == null || response.url().isBlank()) {
            throw new BadRequestException("Stripe Checkout did not return a redirect URL.");
        }

        return StripeCheckoutSessionDTO.builder()
                .sessionId(response.id())
                .url(response.url())
                .build();
    }

    public UserDTO completeSession(Long userId, String sessionId) {
        ensureEnabled();
        if (sessionId == null || sessionId.isBlank()) {
            throw new BadRequestException("Stripe Checkout session id is required.");
        }

        StripeSessionResponse session = getSession(sessionId);
        String sessionUserId = valueFromMetadata(session.metadata(), "user_id");
        if (!String.valueOf(userId).equals(session.clientReferenceId()) && !String.valueOf(userId).equals(sessionUserId)) {
            throw new BadRequestException("Stripe Checkout session does not belong to this user.");
        }
        if (!"subscription".equals(session.mode())) {
            throw new BadRequestException("Stripe Checkout session is not a subscription.");
        }
        if (!"complete".equals(session.status()) || !isPaid(session.paymentStatus())) {
            throw new BadRequestException("Stripe Checkout session is not paid yet.");
        }

        String plan = valueFromMetadata(session.metadata(), "plan");
        String cadence = valueFromMetadata(session.metadata(), "billing_cadence");
        return userService.applyStripeSubscription(
                userId,
                plan,
                cadence,
                "active",
                session.customer(),
                session.subscription());
    }

    private StripeSessionResponse postForm(String path, List<String[]> fields) {
        HttpRequest request = HttpRequest.newBuilder(URI.create(apiBase + path))
                .timeout(Duration.ofSeconds(10))
                .header("Authorization", authorizationHeader())
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(formEncode(fields)))
                .build();
        return send(request);
    }

    private StripeSessionResponse getSession(String sessionId) {
        HttpRequest request = HttpRequest.newBuilder(URI.create(apiBase + "/v1/checkout/sessions/" + encode(sessionId)))
                .timeout(Duration.ofSeconds(10))
                .header("Authorization", authorizationHeader())
                .GET()
                .build();
        return send(request);
    }

    private StripeSessionResponse send(HttpRequest request) {
        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException error) {
            if (error instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new BadRequestException("Stripe Checkout request failed: " + error.getMessage());
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new BadRequestException(stripeErrorMessage(response.body()));
        }

        try {
            return objectMapper.readValue(response.body(), StripeSessionResponse.class);
        } catch (IOException error) {
            throw new BadRequestException("Stripe Checkout response could not be parsed: " + error.getMessage());
        }
    }

    private String stripeErrorMessage(String responseBody) {
        try {
            StripeErrorResponse error = objectMapper.readValue(responseBody, StripeErrorResponse.class);
            if (error.error() != null && error.error().message() != null && !error.error().message().isBlank()) {
                return error.error().message();
            }
        } catch (IOException ignored) {
            // Fall through to a bounded raw response for local debugging.
        }
        if (responseBody != null && !responseBody.isBlank()) {
            return "Stripe Checkout request failed: " + limit(responseBody, 500);
        }
        return "Stripe Checkout request failed.";
    }


    public StripePortalSessionDTO createPortalSession(Long userId) {
        ensureEnabled();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getStripeCustomerId() == null || user.getStripeCustomerId().isBlank()) {
            throw new BadRequestException("User does not have a Stripe customer identity. They must subscribe first.");
        }

        List<String[]> fields = new ArrayList<>();
        fields.add(field("customer", user.getStripeCustomerId()));
        fields.add(field("return_url", frontendUrl + "/app/subscribe"));

        StripeSessionResponse response = postForm("/v1/billing_portal/sessions", fields);

        return StripePortalSessionDTO.builder()
                .url(response.url())
                .build();
    }

    private void ensureEnabled() {
        if (!enabled) {
            throw new BadRequestException("Stripe Checkout is not enabled.");
        }
        if (secretKey == null || secretKey.isBlank()) {
            throw new BadRequestException("Stripe secret key is not configured.");
        }
    }

    private String priceIdFor(String plan, String cadence) {
        String priceId = switch (plan + ":" + cadence) {
            case "READER_PLUS:MONTHLY" -> readerPlusMonthlyPriceId;
            case "READER_PLUS:ANNUAL" -> readerPlusAnnualPriceId;
            case "BACKER:MONTHLY" -> backerMonthlyPriceId;
            case "BACKER:ANNUAL" -> backerAnnualPriceId;
            case "NEWSROOM_PRO:MONTHLY" -> newsroomProMonthlyPriceId;
            case "NEWSROOM_PRO:ANNUAL" -> newsroomProAnnualPriceId;
            default -> throw new BadRequestException("Free plan does not require Stripe Checkout.");
        };
        if (priceId == null || priceId.isBlank()) {
            throw new BadRequestException("Stripe price id is not configured for " + plan + " " + cadence + ".");
        }
        return priceId;
    }

    private String normalizePlan(String value) {
        String normalized = normalize(value);
        if ("FREE".equals(normalized)) {
            throw new BadRequestException("Free plan does not require Stripe Checkout.");
        }
        if (!List.of("READER_PLUS", "BACKER", "NEWSROOM_PRO").contains(normalized)) {
            throw new BadRequestException("Invalid subscription plan: " + value);
        }
        return normalized;
    }

    private String normalizeCadence(String value) {
        String normalized = normalize(value);
        if (!List.of("MONTHLY", "ANNUAL").contains(normalized)) {
            throw new BadRequestException("Invalid billing cadence: " + value);
        }
        return normalized;
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().replace('-', '_').toUpperCase();
    }

    private boolean isPaid(String paymentStatus) {
        return "paid".equals(paymentStatus) || "no_payment_required".equals(paymentStatus);
    }

    private String valueFromMetadata(Map<String, String> metadata, String key) {
        if (metadata == null || !metadata.containsKey(key) || metadata.get(key).isBlank()) {
            throw new BadRequestException("Stripe Checkout session is missing " + key + " metadata.");
        }
        return metadata.get(key);
    }

    private String authorizationHeader() {
        return "Basic " + Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
    }

    private String formEncode(List<String[]> fields) {
        return fields.stream()
                .map(field -> encode(field[0]) + "=" + encode(field[1]))
                .collect(java.util.stream.Collectors.joining("&"));
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String[] field(String key, String value) {
        return new String[] { key, value };
    }

    private String limit(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private record StripeSessionResponse(
            String id,
            String url,
            String mode,
            String status,
            Map<String, String> metadata,
            String customer,
            String subscription,
            @JsonProperty("payment_status") String paymentStatus,
            @JsonProperty("client_reference_id") String clientReferenceId) {
    }

    private record StripeErrorResponse(StripeError error) {
    }

    private record StripeError(String message) {
    }
}
