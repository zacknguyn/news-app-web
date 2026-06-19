package com.nhatlam.redditnews.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.nhatlam.redditnews.dto.request.PostCreateDTO;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.dto.response.PostDTO;
import com.nhatlam.redditnews.entity.Article;
import com.nhatlam.redditnews.entity.Post;
import com.nhatlam.redditnews.entity.Topic;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.entity.User.UserRole;
import com.nhatlam.redditnews.exception.ForbiddenException;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.mapper.PostMapper;
import com.nhatlam.redditnews.repository.ArticleRepository;
import com.nhatlam.redditnews.repository.PostRepository;
import com.nhatlam.redditnews.repository.SavedPostRepository;
import com.nhatlam.redditnews.repository.TopicRepository;
import com.nhatlam.redditnews.repository.UserRepository;
import com.nhatlam.redditnews.repository.CommentRepository;
import com.nhatlam.redditnews.repository.VoteRepository;
import com.nhatlam.redditnews.repository.ReaderHighlightRepository;
import com.nhatlam.redditnews.repository.ReadingProgressRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final TopicRepository topicRepository;
    private final ArticleRepository articleRepository;
    private final CommentRepository commentRepository;
    private final VoteRepository voteRepository;
    private final ReaderHighlightRepository readerHighlightRepository;
    private final ReadingProgressRepository readingProgressRepository;
    private final SavedPostRepository savedPostRepository;
    private final PostMapper postMapper;

    public PostDTO createPost(PostCreateDTO dto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Topic topic = topicRepository.findById(dto.getTopicId())
                .orElseThrow(() -> new ResourceNotFoundException("Topic not found"));

        Post post = new Post();
        post.setTitle(dto.getTitle());
        post.setContent(dto.getContent());
        post.setSourceUrl(dto.getSourceUrl());
        post.setImageUrl(dto.getImageUrl());
        post.setUser(user);
        post.setTopic(topic);
        post.setScore(0);

        if (dto.getArticleId() != null) {
            Article article = articleRepository.findById(dto.getArticleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
            post.setArticle(article);
        }

        return toDTO(postRepository.save(post), userId);
    }

    @Transactional(readOnly = true)
    public PostDTO getById(Long id, Long viewerId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));
        return toDTO(post, viewerId);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<PostDTO> getHotFeed(int page, int size, Long viewerId) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = postRepository.findHotPosts(pageable);
        return PaginatedResponse.of(postPage.map(post -> toDTO(post, viewerId)));
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<PostDTO> getPostsByTopic(Long topicId, int page, int size, Long viewerId) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = postRepository.findByTopicId(topicId, pageable);
        return PaginatedResponse.of(postPage.map(post -> toDTO(post, viewerId)));
    }


    public void deletePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isOwner = post.getUser() != null && userId.equals(post.getUser().getId());
        boolean isAdmin = user.getRole() == UserRole.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You do not have permission to delete this post");
        }

        voteRepository.deleteByPostId(postId);
        readerHighlightRepository.deleteByPostId(postId);
        readingProgressRepository.deleteByPostId(postId);
        postRepository.delete(post);
    }

    public PostDTO toDTO(Post post, Long viewerId) {
        PostDTO dto = postMapper.toDTO(post);
        dto.setCommentCount((int) commentRepository.countByPostId(post.getId()));
        dto.setUserVote(viewerId == null ? null : voteRepository.findByUserIdAndPostId(viewerId, post.getId())
                .map(vote -> vote.getVoteType())
                .orElse(null));
        dto.setSavedByMe(viewerId != null && savedPostRepository.existsByUserIdAndPostId(viewerId, post.getId()));
        return dto;
    }
}
