package com.nhatlam.redditnews.service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhatlam.redditnews.dto.request.ProfileCustomizationUpdateDTO;
import com.nhatlam.redditnews.dto.request.SubscriptionUpdateDTO;
import com.nhatlam.redditnews.dto.response.TrustResponseDTO;
import com.nhatlam.redditnews.dto.response.TrustResponseDTO.TrustFactor;
import com.nhatlam.redditnews.dto.response.UserDTO;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.entity.User.BillingCadence;
import com.nhatlam.redditnews.entity.User.SubscriptionPlan;
import com.nhatlam.redditnews.entity.User.SubscriptionStatus;
import com.nhatlam.redditnews.exception.BadRequestException;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.mapper.UserMapper;
import com.nhatlam.redditnews.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final com.nhatlam.redditnews.repository.PostRepository postRepository;
    private final com.nhatlam.redditnews.repository.CommentRepository commentRepository;

    private static final Map<SubscriptionPlan, List<String>> PLAN_ENTITLEMENTS = Map.of(
            SubscriptionPlan.FREE, List.of("BASIC_READING", "BASIC_SAVED_POSTS"),
            SubscriptionPlan.READER_PLUS, List.of("BASIC_READING", "BASIC_SAVED_POSTS", "DAILY_BRIEFING",
                    "ADVANCED_SAVED_LIBRARY", "FOLLOW_JOURNALIST_ALERTS", "PROFILE_TAGS", "PROFILE_BADGES"),
            SubscriptionPlan.BACKER, List.of("BASIC_READING", "BASIC_SAVED_POSTS", "DAILY_BRIEFING",
                    "ADVANCED_SAVED_LIBRARY", "FOLLOW_JOURNALIST_ALERTS", "PROFILE_TAGS", "PROFILE_BADGES",
                    "CUSTOM_PROFILE_ACCENT", "SOURCE_NOTES", "SUBSCRIBER_DISCUSSIONS", "SUPPORT_ALLOCATION"),
            SubscriptionPlan.NEWSROOM_PRO, List.of("BASIC_READING", "BASIC_SAVED_POSTS", "DAILY_BRIEFING",
                    "ADVANCED_SAVED_LIBRARY", "FOLLOW_JOURNALIST_ALERTS", "PROFILE_TAGS", "PROFILE_BADGES",
                    "CUSTOM_PROFILE_ACCENT", "SOURCE_NOTES", "SUBSCRIBER_DISCUSSIONS", "SUPPORT_ALLOCATION", "SHARED_SAVED_FOLDERS",
                    "EXPORT_MARKDOWN_PDF", "RESEARCH_ARCHIVE"));

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return toDTO(user);
    }

    public UserDTO getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        return toDTO(user);
    }

    @Transactional
    public UserDTO updateUserProfile(Long id, UserDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        userMapper.updateEntityFromDTO(dto, user);
        return toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO updateFavoriteTopics(Long id, List<String> topics) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        user.setFavoriteTopics(topics);
        return toDTO(userRepository.save(user));
    }

    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional
    public UserDTO updateSubscription(Long id, SubscriptionUpdateDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        SubscriptionPlan previousPlan = user.getSubscriptionPlan();
        if (dto.getPlan() != null && !dto.getPlan().isBlank()) {
            user.setSubscriptionPlan(parsePlan(dto.getPlan()));
        }
        if (dto.getBillingCadence() != null && !dto.getBillingCadence().isBlank()) {
            user.setBillingCadence(parseBillingCadence(dto.getBillingCadence()));
        }
        user.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        applyUnlockedBadges(user, previousPlan != user.getSubscriptionPlan());
        return toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO applyStripeSubscription(
            Long id,
            String plan,
            String billingCadence,
            String subscriptionStatus,
            String stripeCustomerId,
            String stripeSubscriptionId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        SubscriptionPlan previousPlan = user.getSubscriptionPlan();
        SubscriptionStatus status = parseSubscriptionStatus(subscriptionStatus);

        if (status == SubscriptionStatus.ACTIVE) {
            user.setSubscriptionPlan(parsePlan(plan));
            user.setBillingCadence(parseBillingCadence(billingCadence));
        }
        if (status == SubscriptionStatus.CANCELED) {
            user.setSubscriptionPlan(SubscriptionPlan.FREE);
            user.setBillingCadence(BillingCadence.MONTHLY);
            user.setProfileAccent(null);
        }

        user.setSubscriptionStatus(status);
        if (stripeCustomerId != null && !stripeCustomerId.isBlank()) {
            user.setStripeCustomerId(stripeCustomerId);
        }
        if (stripeSubscriptionId != null && !stripeSubscriptionId.isBlank()) {
            user.setStripeSubscriptionId(stripeSubscriptionId);
        }
        applyUnlockedBadges(user, previousPlan != user.getSubscriptionPlan());
        return toDTO(userRepository.save(user));
    }

    @Transactional
    public UserDTO updateProfileCustomization(Long id, ProfileCustomizationUpdateDTO dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        List<String> entitlements = entitlementsFor(user.getSubscriptionPlan());

        if (dto.getProfileHeadline() != null) {
            user.setProfileHeadline(limit(dto.getProfileHeadline(), 160));
        }
        if (dto.getProfileBio() != null) {
            user.setProfileBio(limit(dto.getProfileBio(), 2000));
        }
        if (dto.getProfileTags() != null && entitlements.contains("PROFILE_TAGS")) {
            user.setProfileTags(dto.getProfileTags().stream()
                    .filter(tag -> tag != null && !tag.isBlank())
                    .map(tag -> limit(tag.trim(), 40))
                    .distinct()
                    .limit(8)
                    .collect(java.util.stream.Collectors.toCollection(ArrayList::new)));
        }
        if (dto.getProfileAccent() != null && entitlements.contains("CUSTOM_PROFILE_ACCENT")) {
            user.setProfileAccent(limit(dto.getProfileAccent(), 40));
        }
        if (dto.getSelectedBadge() != null && entitlements.contains("PROFILE_BADGES")
                && user.getUnlockedBadges().contains(dto.getSelectedBadge())) {
            user.setSelectedBadge(dto.getSelectedBadge());
        }

        return toDTO(userRepository.save(user));
    }

    public TrustResponseDTO getTrust(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        int accountAgeDays = (int) ChronoUnit.DAYS.between(
                user.getCreatedAt() != null ? user.getCreatedAt() : LocalDateTime.now(),
                LocalDateTime.now());
        int longevity = Math.min(accountAgeDays * 2, 250);

        int postScore = Math.min(Math.max(postRepository.getAccumulatedScoreByUserId(userId), 0), 300);

        long commentCount = commentRepository.findByUserIdOrderByCreatedAtDesc(userId).size();
        int civility = Math.min((int) commentCount * 5, 200);

        int completeness = 0;
        if (user.getProfileHeadline() != null && !user.getProfileHeadline().isBlank()) completeness += 30;
        if (user.getProfileBio() != null && !user.getProfileBio().isBlank()) completeness += 30;
        if (user.getAvatar() != null && !user.getAvatar().isBlank()) completeness += 40;

        int subscription = switch (user.getSubscriptionPlan() != null ? user.getSubscriptionPlan() : SubscriptionPlan.FREE) {
            case FREE -> 50;
            case READER_PLUS -> 100;
            case BACKER -> 125;
            case NEWSROOM_PRO -> 150;
        };

        int total = longevity + postScore + civility + completeness + subscription;

        return TrustResponseDTO.builder()
                .totalScore(total)
                .maxScore(1000)
                .factors(List.of(
                        TrustFactor.builder().label("Longevity").score(longevity).max(250).build(),
                        TrustFactor.builder().label("Post score").score(postScore).max(300).build(),
                        TrustFactor.builder().label("Civility").score(civility).max(200).build(),
                        TrustFactor.builder().label("Profile completeness").score(completeness).max(100).build(),
                        TrustFactor.builder().label("Subscription").score(subscription).max(150).build()
                ))
                .build();
    }

    public UserDTO toDTO(User user) {
        UserDTO dto = userMapper.toDTO(user);
        dto.setEntitlements(entitlementsFor(user.getSubscriptionPlan()));
        return dto;
    }

    private List<String> entitlementsFor(SubscriptionPlan plan) {
        return PLAN_ENTITLEMENTS.getOrDefault(
                plan == null ? SubscriptionPlan.FREE : plan,
                PLAN_ENTITLEMENTS.get(SubscriptionPlan.FREE));
    }

    private void applyUnlockedBadges(User user, boolean planChanged) {
        List<String> badges = switch (user.getSubscriptionPlan()) {
            case FREE -> new ArrayList<>();
            case READER_PLUS -> new ArrayList<>(List.of("Reader Plus"));
            case BACKER -> new ArrayList<>(List.of("Reader Plus", "Backer", "Source Supporter"));
            case NEWSROOM_PRO -> new ArrayList<>(
                    List.of("Reader Plus", "Backer", "Source Supporter", "Newsroom Pro", "Research Desk"));
        };
        user.setUnlockedBadges(badges);
        if (planChanged || user.getSelectedBadge() == null || !badges.contains(user.getSelectedBadge())) {
            user.setSelectedBadge(defaultBadgeForPlan(user.getSubscriptionPlan()));
        }
    }

    private String defaultBadgeForPlan(SubscriptionPlan plan) {
        return switch (plan) {
            case FREE -> null;
            case READER_PLUS -> "Reader Plus";
            case BACKER -> "Backer";
            case NEWSROOM_PRO -> "Newsroom Pro";
        };
    }

    private SubscriptionPlan parsePlan(String value) {
        String normalized = value.trim().replace('-', '_').toUpperCase(Locale.ROOT);
        try {
            return SubscriptionPlan.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported subscription plan: " + value);
        }
    }

    private BillingCadence parseBillingCadence(String value) {
        String normalized = value.trim().replace('-', '_').toUpperCase(Locale.ROOT);
        try {
            return BillingCadence.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported billing cadence: " + value);
        }
    }

    private SubscriptionStatus parseSubscriptionStatus(String value) {
        String normalized = value == null ? "" : value.trim().replace('-', '_').toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "ACTIVE", "TRIALING" -> SubscriptionStatus.ACTIVE;
            case "PAST_DUE", "UNPAID" -> SubscriptionStatus.PAST_DUE;
            case "CANCELED", "INCOMPLETE_EXPIRED" -> SubscriptionStatus.CANCELED;
            default -> throw new BadRequestException("Unsupported subscription status: " + value);
        };
    }

    private String limit(String value, int maxLength) {
        String trimmed = value.trim();
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }
}
