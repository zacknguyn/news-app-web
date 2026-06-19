package com.nhatlam.redditnews.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ad_campaigns")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdCampaign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "partner_id", nullable = false)
    private User partner;

    @Column(nullable = false, length = 160)
    private String brandName;

    @Column(nullable = false, length = 240)
    private String headline;

    @Column(nullable = false, length = 1000)
    private String body;

    @Column(nullable = false, length = 500)
    private String landingUrl;

    @Column(length = 500)
    private String imageUrl;

    @Column(length = 80)
    private String placement;

    @Column(length = 240)
    private String targetAudience;

    private LocalDateTime startsAt;

    private LocalDateTime endsAt;

    @Column(length = 240)
    private String budgetNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private AdCampaignStatus status = AdCampaignStatus.DRAFT;

    @Column(length = 1000)
    private String reviewNote;

    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private User reviewedBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public enum AdCampaignStatus {
        DRAFT, SUBMITTED, NEEDS_CHANGES, APPROVED, SCHEDULED, LIVE, ENDED, REJECTED
    }
}
