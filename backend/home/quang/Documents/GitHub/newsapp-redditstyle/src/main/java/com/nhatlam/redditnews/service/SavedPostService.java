package com.nhatlam.redditnews.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhatlam.redditnews.dto.response.SavedPostDTO;
import com.nhatlam.redditnews.entity.Post;
import com.nhatlam.redditnews.entity.SavedPost;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.repository.PostRepository;
import com.nhatlam.redditnews.repository.SavedPostRepository;
import com.nhatlam.redditnews.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SavedPostService {
    private final SavedPostRepository savedPostRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostService postService;

    @Transactional(readOnly = true)
    public List<SavedPostDTO> getSavedPostsByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        return savedPostRepository.findByUserIdOrderBySavedAtDesc(userId).stream()
                .map(savedPost -> toDTO(savedPost, userId))
                .toList();
    }

    @Transactional
    public SavedPostDTO savePost(Long userId, Long postId) {
        if (savedPostRepository.existsByUserIdAndPostId(userId, postId)) {
            throw new ResourceNotFoundException("Post already saved by this user");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        SavedPost savedPost = SavedPost.builder().user(user).post(post).build();
        return toDTO(savedPostRepository.save(savedPost), userId);
    }

    @Transactional
    public void unsavePost(Long userId, Long postId) {
        if (!savedPostRepository.existsByUserIdAndPostId(userId, postId)) {
            throw new ResourceNotFoundException("Saved post relationship not found");
        }
        savedPostRepository.deleteByUserIdAndPostId(userId, postId);
    }

    private SavedPostDTO toDTO(SavedPost savedPost, Long viewerId) {
        return SavedPostDTO.builder()
                .id(savedPost.getId())
                .post(postService.toDTO(savedPost.getPost(), viewerId))
                .savedAt(savedPost.getSavedAt())
                .build();
    }
}
