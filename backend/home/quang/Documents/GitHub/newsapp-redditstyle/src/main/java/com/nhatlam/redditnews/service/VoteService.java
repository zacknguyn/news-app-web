package com.nhatlam.redditnews.service;

import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.nhatlam.redditnews.entity.Post;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.entity.Vote;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.dto.response.VoteResponseDTO;
import com.nhatlam.redditnews.repository.PostRepository;
import com.nhatlam.redditnews.repository.UserRepository;
import com.nhatlam.redditnews.repository.VoteRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class VoteService {

    private final VoteRepository voteRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public VoteResponseDTO votePost(Long postId, Long userId, Integer voteType) {
        if (voteType != 1 && voteType != -1) {
            throw new IllegalArgumentException("Vote type must be 1 (Upvote) or -1 (Downvote)");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Optional<Vote> existingVote = voteRepository.findByUserIdAndPostId(userId, postId);

        Integer userVote;
        if (existingVote.isPresent()) {
            Vote vote = existingVote.get();
            if (vote.getVoteType().equals(voteType)) {
                post.setScore(post.getScore() - voteType);
                voteRepository.delete(vote);
                userVote = null;
            } else {
                post.setScore(post.getScore() + (2 * voteType));
                vote.setVoteType(voteType);
                voteRepository.save(vote);
                userVote = voteType;
            }
        } else {
            Vote vote = new Vote();
            vote.setUser(user);
            vote.setPost(post);
            vote.setVoteType(voteType);
            voteRepository.save(vote);

            post.setScore(post.getScore() + voteType);
            userVote = voteType;
        }
        Post savedPost = postRepository.save(post);
        return VoteResponseDTO.builder()
                .postId(savedPost.getId())
                .score(savedPost.getScore())
                .userVote(userVote)
                .build();
    }
}
