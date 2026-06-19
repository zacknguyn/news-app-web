package com.nhatlam.redditnews.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhatlam.redditnews.dto.request.CommentCreateDTO;
import com.nhatlam.redditnews.dto.response.CommentDTO;
import com.nhatlam.redditnews.dto.response.PaginatedResponse;
import com.nhatlam.redditnews.entity.Article;
import com.nhatlam.redditnews.entity.Comment;
import com.nhatlam.redditnews.entity.CommentLike;
import com.nhatlam.redditnews.entity.Post;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.mapper.CommentMapper;
import com.nhatlam.redditnews.repository.ArticleRepository;
import com.nhatlam.redditnews.repository.CommentLikeRepository;
import com.nhatlam.redditnews.repository.CommentRepository;
import com.nhatlam.redditnews.repository.PostRepository;
import com.nhatlam.redditnews.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final ArticleRepository articleRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentMapper commentMapper;

    @Transactional(readOnly = true)
    public List<CommentDTO> getCommentsByArticleId(Long articleId) {
        if (!articleRepository.existsById(articleId)) {
            throw new ResourceNotFoundException("Article not found with id " + articleId);
        }
        List<Comment> comments = commentRepository.findByArticleIdAndParentIsNullOrderByCreatedAtDesc(articleId);
        return commentMapper.toDTOList(comments);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<CommentDTO> getCommentsByArticleIdPaged(Long articleId, int page, int size, Long viewerId) {
        if (!articleRepository.existsById(articleId)) {
            throw new ResourceNotFoundException("Article not found with id " + articleId);
        }
        Pageable pageable = PageRequest.of(page, size);
        Page<Comment> commentPage = commentRepository.findByArticleIdAndParentIsNullOrderByCreatedAtDesc(articleId, pageable);
        Page<CommentDTO> dtoPage = commentPage.map(comment -> toDTO(comment, viewerId));
        return PaginatedResponse.of(dtoPage);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<CommentDTO> getCommentsByPostIdPaged(Long postId, int page, int size, Long viewerId) {
        if (!postRepository.existsById(postId)) {
            throw new ResourceNotFoundException("Post not found with id " + postId);
        }
        Pageable pageable = PageRequest.of(page, size);
        Page<Comment> commentPage = commentRepository.findByPostIdAndParentIsNullOrderByCreatedAtDesc(postId, pageable);
        Page<CommentDTO> dtoPage = commentPage.map(comment -> toDTO(comment, viewerId));
        return PaginatedResponse.of(dtoPage);
    }

    public CommentDTO createComment(Long articleId, Long userId, CommentCreateDTO commentDTO) {
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found with id " + articleId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

        Comment comment = commentMapper.toEntity(commentDTO);
        comment.setArticle(article);
        comment.setUser(user);
        comment.setUserName(user.getName());
        comment.setUserAvatar(user.getAvatar());

        if (commentDTO.getParentId() != null) {
            Comment parentComment = commentRepository.findById(commentDTO.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found with id " + commentDTO.getParentId()));
            comment.setParent(parentComment);
        }

        return toDTO(commentRepository.save(comment), userId);
    }

    public CommentDTO createPostComment(Long postId, Long userId, CommentCreateDTO commentDTO) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id " + postId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

        Comment comment = commentMapper.toEntity(commentDTO);
        comment.setPost(post);
        comment.setUser(user);
        comment.setUserName(user.getName());
        comment.setUserAvatar(user.getAvatar());

        if (commentDTO.getParentId() != null) {
            Comment parentComment = commentRepository.findById(commentDTO.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found with id " + commentDTO.getParentId()));
            if (parentComment.getPost() == null || !parentComment.getPost().getId().equals(postId)) {
                throw new ResourceNotFoundException("Parent comment does not belong to post with id " + postId);
            }
            comment.setParent(parentComment);
        }

        return toDTO(commentRepository.save(comment), userId);
    }

    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id " + commentId));
        if (!comment.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("User not authorized to delete comment with id " + commentId);
        }
        commentRepository.delete(comment);
    }

    public CommentDTO likeComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id " + commentId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));

        if (!commentLikeRepository.existsByUserIdAndCommentId(userId, commentId)) {
            CommentLike like = new CommentLike();
            like.setUser(user);
            like.setComment(comment);
            commentLikeRepository.save(like);
            comment.incrementLikes();
            commentRepository.save(comment);
        }

        return toDTO(comment, userId);
    }

    public CommentDTO unlikeComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id " + commentId));

        commentLikeRepository.findByUserIdAndCommentId(userId, commentId).ifPresent(commentLike -> {
            commentLikeRepository.delete(commentLike);
            comment.decrementLikes();
            commentRepository.save(comment);
        });

        return toDTO(comment, userId);
    }

    private CommentDTO toDTO(Comment comment, Long viewerId) {
        CommentDTO dto = commentMapper.toDTO(comment);
        dto.setLikedByMe(viewerId != null && commentLikeRepository.existsByUserIdAndCommentId(viewerId, comment.getId()));
        if (dto.getReplies() != null && comment.getReplies() != null) {
            dto.setReplies(comment.getReplies().stream()
                    .map(reply -> toDTO(reply, viewerId))
                    .toList());
        }
        return dto;
    }
}
