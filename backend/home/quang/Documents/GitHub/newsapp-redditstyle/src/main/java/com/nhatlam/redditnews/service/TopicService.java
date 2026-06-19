package com.nhatlam.redditnews.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.nhatlam.redditnews.dto.request.TopicCreateDTO;
import com.nhatlam.redditnews.dto.response.TopicDTO;
import com.nhatlam.redditnews.entity.Topic;
import com.nhatlam.redditnews.entity.TopicMembership;
import com.nhatlam.redditnews.entity.TopicMembership.TopicMemberRole;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.exception.BadRequestException;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.mapper.TopicMapper;
import com.nhatlam.redditnews.repository.PostRepository;
import com.nhatlam.redditnews.repository.TopicMembershipRepository;
import com.nhatlam.redditnews.repository.TopicRepository;
import com.nhatlam.redditnews.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class TopicService {

    private final TopicRepository topicRepository;
    private final TopicMembershipRepository topicMembershipRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final TopicMapper topicMapper;
    private final SlugService slugService;

    @Transactional(readOnly = true)
    public List<TopicDTO> getAllTopics(Long viewerId) {
        return topicRepository.findAll().stream()
                .map(topic -> toDTO(topic, viewerId))
                .toList();
    }

    @Transactional(readOnly = true)
    public TopicDTO getTopicById(Long id, Long viewerId) {
        Topic topic = topicRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + id));
        return toDTO(topic, viewerId);
    }

    @Transactional(readOnly = true)
    public TopicDTO getTopicBySlug(String slug, Long viewerId) {
        Topic topic = topicRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with slug: " + slug));
        return toDTO(topic, viewerId);
    }

    @Transactional(readOnly = true)
    public List<TopicDTO> getMyTopics(Long userId) {
        return topicMembershipRepository.findByUserIdOrderByJoinedAtDesc(userId).stream()
                .map(membership -> toDTO(membership.getTopic(), userId))
                .toList();
    }

    public TopicDTO createTopic(TopicCreateDTO dto, Long ownerId) {
        String slug = slugService.toSlug(dto.getName());
        if (topicRepository.existsBySlug(slug)) {
            throw new BadRequestException("Topic with this name already exists");
        }
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Topic topic = topicMapper.toEntity(dto);
        topic.setSlug(slug);
        topic.setOwner(owner);
        topic.setMemberCount(1);
        Topic saved = topicRepository.save(topic);

        TopicMembership membership = new TopicMembership();
        membership.setTopic(saved);
        membership.setUser(owner);
        membership.setRole(TopicMemberRole.OWNER);
        topicMembershipRepository.save(membership);

        return toDTO(saved, ownerId);
    }

    public TopicDTO joinTopic(Long topicId, Long userId) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + topicId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!topicMembershipRepository.existsByTopicIdAndUserId(topicId, userId)) {
            TopicMembership membership = new TopicMembership();
            membership.setTopic(topic);
            membership.setUser(user);
            membership.setRole(TopicMemberRole.MEMBER);
            topicMembershipRepository.save(membership);
            topic.setMemberCount(topic.getMemberCount() + 1);
            topicRepository.save(topic);
        }

        return toDTO(topic, userId);
    }

    public TopicDTO leaveTopic(Long topicId, Long userId) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found with id: " + topicId));

        Optional<TopicMembership> membership = topicMembershipRepository.findByTopicIdAndUserId(topicId, userId);
        if (membership.isPresent()) {
            if (membership.get().getRole() == TopicMemberRole.OWNER) {
                throw new BadRequestException("Topic owner cannot leave their own topic");
            }
            topicMembershipRepository.delete(membership.get());
            topic.setMemberCount(Math.max(0, topic.getMemberCount() - 1));
            topicRepository.save(topic);
        }

        return toDTO(topic, userId);
    }

    private TopicDTO toDTO(Topic topic, Long viewerId) {
        TopicDTO dto = topicMapper.toDTO(topic);
        dto.setOwnerId(topic.getOwner() != null ? topic.getOwner().getId() : null);
        dto.setOwnerName(topic.getOwner() != null ? topic.getOwner().getName() : null);
        dto.setPostCount(postRepository.countByTopicId(topic.getId()));
        dto.setJoined(viewerId != null && topicMembershipRepository.existsByTopicIdAndUserId(topic.getId(), viewerId));
        return dto;
    }
}
