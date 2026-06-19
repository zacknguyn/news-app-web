package com.nhatlam.redditnews.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import com.nhatlam.redditnews.entity.CredentialRequest;
import com.nhatlam.redditnews.entity.CredentialRequest.CredentialRequestStatus;

public interface CredentialRequestRepository extends JpaRepository<CredentialRequest, Long> {
    boolean existsByEmail(String email);
    Optional<CredentialRequest> findByEmail(String email);
    Page<CredentialRequest> findByStatus(CredentialRequestStatus status, Pageable pageable);
}
