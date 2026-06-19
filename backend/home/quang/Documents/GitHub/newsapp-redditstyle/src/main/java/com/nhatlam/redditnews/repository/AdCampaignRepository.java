package com.nhatlam.redditnews.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.nhatlam.redditnews.entity.AdCampaign;
import com.nhatlam.redditnews.entity.AdCampaign.AdCampaignStatus;

@Repository
public interface AdCampaignRepository extends JpaRepository<AdCampaign, Long> {
    Page<AdCampaign> findByPartnerId(Long partnerId, Pageable pageable);

    Page<AdCampaign> findByStatus(AdCampaignStatus status, Pageable pageable);
}
