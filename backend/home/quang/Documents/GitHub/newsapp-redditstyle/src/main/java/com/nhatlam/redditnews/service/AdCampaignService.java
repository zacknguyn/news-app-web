package com.nhatlam.redditnews.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhatlam.redditnews.dto.request.AdCampaignRequestDTO;
import com.nhatlam.redditnews.dto.request.AdCampaignReviewDTO;
import com.nhatlam.redditnews.dto.response.AdCampaignDTO;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.entity.AdCampaign;
import com.nhatlam.redditnews.entity.AdCampaign.AdCampaignStatus;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.exception.BadRequestException;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.repository.AdCampaignRepository;
import com.nhatlam.redditnews.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdCampaignService {

    private final AdCampaignRepository adCampaignRepository;
    private final UserRepository userRepository;

    public PaginatedResponse<AdCampaignDTO> listMine(String email, int page, int size) {
        User partner = getUser(email);
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        return paginate(adCampaignRepository.findByPartnerId(partner.getId(), pageable));
    }

    public PaginatedResponse<AdCampaignDTO> listForAdmin(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        if (status != null && !status.isBlank()) {
            try {
                return paginate(adCampaignRepository.findByStatus(AdCampaignStatus.valueOf(status.toUpperCase()), pageable));
            } catch (IllegalArgumentException ignored) {
                return paginate(Page.empty(pageable));
            }
        }
        return paginate(adCampaignRepository.findAll(pageable));
    }

    @Transactional
    public AdCampaignDTO create(String email, AdCampaignRequestDTO dto) {
        User partner = getUser(email);
        AdCampaign campaign = AdCampaign.builder().partner(partner).status(AdCampaignStatus.DRAFT).build();
        apply(dto, campaign);
        return toDTO(adCampaignRepository.save(campaign));
    }

    @Transactional
    public AdCampaignDTO updateMine(String email, Long id, AdCampaignRequestDTO dto) {
        User partner = getUser(email);
        AdCampaign campaign = getCampaign(id);
        requireOwner(partner, campaign);
        if (!canPartnerEdit(campaign.getStatus())) {
            throw new BadRequestException("Submitted or approved campaigns cannot be edited by partner.");
        }
        apply(dto, campaign);
        campaign.setStatus(AdCampaignStatus.DRAFT);
        campaign.setReviewNote(null);
        return toDTO(adCampaignRepository.save(campaign));
    }

    @Transactional
    public AdCampaignDTO submitMine(String email, Long id) {
        User partner = getUser(email);
        AdCampaign campaign = getCampaign(id);
        requireOwner(partner, campaign);
        if (!canPartnerEdit(campaign.getStatus())) {
            throw new BadRequestException("Campaign is already in review or approved.");
        }
        campaign.setStatus(AdCampaignStatus.SUBMITTED);
        campaign.setSubmittedAt(LocalDateTime.now());
        campaign.setReviewNote(null);
        return toDTO(adCampaignRepository.save(campaign));
    }

    @Transactional
    public AdCampaignDTO approve(Long id, String adminEmail, AdCampaignReviewDTO dto) {
        User admin = getUser(adminEmail);
        AdCampaign campaign = getCampaign(id);
        if (campaign.getStatus() != AdCampaignStatus.SUBMITTED && campaign.getStatus() != AdCampaignStatus.NEEDS_CHANGES) {
            throw new BadRequestException("Only submitted campaigns can be approved.");
        }
        campaign.setStatus(AdCampaignStatus.APPROVED);
        campaign.setReviewNote(dto != null ? dto.getReviewNote() : null);
        campaign.setReviewedBy(admin);
        campaign.setReviewedAt(LocalDateTime.now());
        return toDTO(adCampaignRepository.save(campaign));
    }

    @Transactional
    public AdCampaignDTO reject(Long id, String adminEmail, AdCampaignReviewDTO dto) {
        User admin = getUser(adminEmail);
        AdCampaign campaign = getCampaign(id);
        if (campaign.getStatus() != AdCampaignStatus.SUBMITTED && campaign.getStatus() != AdCampaignStatus.NEEDS_CHANGES) {
            throw new BadRequestException("Only submitted campaigns can be rejected.");
        }
        campaign.setStatus(AdCampaignStatus.REJECTED);
        campaign.setReviewNote(dto != null ? dto.getReviewNote() : null);
        campaign.setReviewedBy(admin);
        campaign.setReviewedAt(LocalDateTime.now());
        return toDTO(adCampaignRepository.save(campaign));
    }

    private boolean canPartnerEdit(AdCampaignStatus status) {
        return status == AdCampaignStatus.DRAFT || status == AdCampaignStatus.NEEDS_CHANGES || status == AdCampaignStatus.REJECTED;
    }

    private void requireOwner(User partner, AdCampaign campaign) {
        if (!campaign.getPartner().getId().equals(partner.getId())) {
            throw new ResourceNotFoundException("Ad campaign not found.");
        }
    }

    private void apply(AdCampaignRequestDTO dto, AdCampaign campaign) {
        campaign.setBrandName(dto.getBrandName().trim());
        campaign.setHeadline(dto.getHeadline().trim());
        campaign.setBody(dto.getBody().trim());
        campaign.setLandingUrl(dto.getLandingUrl().trim());
        campaign.setImageUrl(blankToNull(dto.getImageUrl()));
        campaign.setPlacement(blankToNull(dto.getPlacement()));
        campaign.setTargetAudience(blankToNull(dto.getTargetAudience()));
        campaign.setStartsAt(dto.getStartsAt());
        campaign.setEndsAt(dto.getEndsAt());
        campaign.setBudgetNote(blankToNull(dto.getBudgetNote()));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    private AdCampaign getCampaign(Long id) {
        return adCampaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ad campaign not found with id: " + id));
    }

    private PaginatedResponse<AdCampaignDTO> paginate(Page<AdCampaign> page) {
        return PaginatedResponse.<AdCampaignDTO>builder()
                .content(page.getContent().stream().map(this::toDTO).toList())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private AdCampaignDTO toDTO(AdCampaign campaign) {
        User partner = campaign.getPartner();
        User reviewer = campaign.getReviewedBy();
        return AdCampaignDTO.builder()
                .id(campaign.getId())
                .partnerId(partner != null ? partner.getId() : null)
                .partnerName(partner != null ? partner.getName() : null)
                .partnerEmail(partner != null ? partner.getEmail() : null)
                .brandName(campaign.getBrandName())
                .headline(campaign.getHeadline())
                .body(campaign.getBody())
                .landingUrl(campaign.getLandingUrl())
                .imageUrl(campaign.getImageUrl())
                .placement(campaign.getPlacement())
                .targetAudience(campaign.getTargetAudience())
                .startsAt(campaign.getStartsAt())
                .endsAt(campaign.getEndsAt())
                .budgetNote(campaign.getBudgetNote())
                .status(campaign.getStatus() != null ? campaign.getStatus().name() : "DRAFT")
                .reviewNote(campaign.getReviewNote())
                .reviewedById(reviewer != null ? reviewer.getId() : null)
                .reviewedByName(reviewer != null ? reviewer.getName() : null)
                .submittedAt(campaign.getSubmittedAt())
                .reviewedAt(campaign.getReviewedAt())
                .createdAt(campaign.getCreatedAt())
                .updatedAt(campaign.getUpdatedAt())
                .build();
    }
}
