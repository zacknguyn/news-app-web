package com.nhatlam.redditnews.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.*;

import org.hibernate.annotations.CreationTimestamp;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String avatar;

    @Column(length = 160)
    private String profileHeadline;

    @Column(length = 2000)
    private String profileBio;

    @Column(length = 40)
    private String profileAccent;

    @Column(length = 80)
    private String selectedBadge;

    @Column(length = 80)
    private String stripeCustomerId;

    @Column(length = 80)
    private String stripeSubscriptionId;

    @ElementCollection
    @CollectionTable(name = "user_profile_tags", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "tag", length = 40)
    @Builder.Default
    private List<String> profileTags = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "user_unlocked_badges", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "badge", length = 80)
    @Builder.Default
    private List<String> unlockedBadges = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30, columnDefinition = "varchar(30) default 'FREE'")
    @Builder.Default
    private SubscriptionPlan subscriptionPlan = SubscriptionPlan.FREE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'MONTHLY'")
    @Builder.Default
    private BillingCadence billingCadence = BillingCadence.MONTHLY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'ACTIVE'")
    @Builder.Default
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default //loai bo canh bao cua lombok vi dung @Builder
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20, columnDefinition = "varchar(20) default 'ACTIVE'")
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @ElementCollection
    @CollectionTable(name = "user_favorite_topics", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "topic")
    @Builder.Default
    private List<String> favoriteTopics = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<SavedArticle> savedArticles = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Comment> comments = new ArrayList<>();

    public enum UserRole {
        USER, PARTNER, ADMIN
    }

    public enum UserStatus {
        PENDING, ACTIVE, REJECTED, SUSPENDED
    }

    public enum SubscriptionPlan {
        FREE, READER_PLUS, BACKER, NEWSROOM_PRO
    }

    public enum BillingCadence {
        MONTHLY, ANNUAL
    }

    public enum SubscriptionStatus {
        ACTIVE, CANCELED, PAST_DUE
    }
}
