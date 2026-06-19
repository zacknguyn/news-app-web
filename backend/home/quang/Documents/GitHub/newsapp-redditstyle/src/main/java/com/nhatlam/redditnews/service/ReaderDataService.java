package com.nhatlam.redditnews.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhatlam.redditnews.dto.request.ReaderHighlightCreateDTO;
import com.nhatlam.redditnews.dto.request.ReaderHighlightUpdateDTO;
import com.nhatlam.redditnews.dto.request.ReadingProgressUpdateDTO;
import com.nhatlam.redditnews.dto.response.ReaderHighlightDTO;
import com.nhatlam.redditnews.dto.response.ReadingProgressDTO;
import com.nhatlam.redditnews.entity.Article;
import com.nhatlam.redditnews.entity.Post;
import com.nhatlam.redditnews.entity.ReaderHighlight;
import com.nhatlam.redditnews.entity.ReadingProgress;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.exception.BadRequestException;
import com.nhatlam.redditnews.exception.ForbiddenException;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.repository.ArticleRepository;
import com.nhatlam.redditnews.repository.PostRepository;
import com.nhatlam.redditnews.repository.ReaderHighlightRepository;
import com.nhatlam.redditnews.repository.ReadingProgressRepository;
import com.nhatlam.redditnews.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReaderDataService {
    private final ReaderHighlightRepository readerHighlightRepository;
    private final ReadingProgressRepository readingProgressRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ArticleRepository articleRepository;

    public List<ReaderHighlightDTO> getHighlights(Long userId) {
        return readerHighlightRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toHighlightDTO).toList();
    }

    public List<ReaderHighlightDTO> getHighlightsByPost(Long userId, Long postId) {
        return readerHighlightRepository.findByUserIdAndPostIdOrderByCreatedAtDesc(userId, postId).stream()
                .map(this::toHighlightDTO).toList();
    }

    public List<ReaderHighlightDTO> getHighlightsByArticle(Long userId, Long articleId) {
        return readerHighlightRepository.findByUserIdAndArticleIdOrderByCreatedAtDesc(userId, articleId).stream()
                .map(this::toHighlightDTO).toList();
    }

    @Transactional
    public ReaderHighlightDTO createHighlight(Long userId, ReaderHighlightCreateDTO dto) {
        if (dto.getPostId() == null && dto.getArticleId() == null) {
            throw new BadRequestException("postId or articleId is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        Post post = dto.getPostId() == null ? null : postRepository.findById(dto.getPostId())
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + dto.getPostId()));
        Article article = dto.getArticleId() == null ? null : articleRepository.findById(dto.getArticleId())
                .orElseThrow(() -> new ResourceNotFoundException("Article not found with id: " + dto.getArticleId()));

        ReaderHighlight highlight = ReaderHighlight.builder()
                .user(user)
                .post(post)
                .article(article)
                .text(dto.getText().trim())
                .startOffset(dto.getStartOffset())
                .endOffset(dto.getEndOffset())
                .note(dto.getNote() == null ? null : dto.getNote().trim())
                .build();

        return toHighlightDTO(readerHighlightRepository.save(highlight));
    }

    @Transactional
    public ReaderHighlightDTO updateHighlight(Long userId, Long id, ReaderHighlightUpdateDTO dto) {
        ReaderHighlight highlight = readerHighlightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Highlight not found with id: " + id));
        ensureOwner(userId, highlight.getUser().getId());
        highlight.setNote(dto.getNote() == null ? null : dto.getNote().trim());
        return toHighlightDTO(readerHighlightRepository.save(highlight));
    }

    @Transactional
    public void deleteHighlight(Long userId, Long id) {
        ReaderHighlight highlight = readerHighlightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Highlight not found with id: " + id));
        ensureOwner(userId, highlight.getUser().getId());
        readerHighlightRepository.delete(highlight);
    }

    public List<ReadingProgressDTO> getProgress(Long userId) {
        return readingProgressRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream().map(this::toProgressDTO).toList();
    }

    @Transactional
    public ReadingProgressDTO upsertProgress(Long userId, ReadingProgressUpdateDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        Post post = postRepository.findById(dto.getPostId())
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + dto.getPostId()));
        Article article = dto.getArticleId() == null ? null : articleRepository.findById(dto.getArticleId())
                .orElseThrow(() -> new ResourceNotFoundException("Article not found with id: " + dto.getArticleId()));

        ReadingProgress progress = readingProgressRepository.findByUserIdAndPostId(userId, dto.getPostId())
                .orElseGet(() -> ReadingProgress.builder().user(user).post(post).build());
        progress.setArticle(article);
        progress.setProgress(dto.getProgress());
        progress.setScrollY(dto.getScrollY());

        return toProgressDTO(readingProgressRepository.save(progress));
    }

    @Transactional
    public void clearProgress(Long userId, Long postId) {
        readingProgressRepository.deleteByUserIdAndPostId(userId, postId);
    }

    private void ensureOwner(Long userId, Long ownerId) {
        if (!userId.equals(ownerId)) {
            throw new ForbiddenException("You do not own this reader data");
        }
    }

    private ReaderHighlightDTO toHighlightDTO(ReaderHighlight highlight) {
        Post post = highlight.getPost();
        Article article = highlight.getArticle();
        return ReaderHighlightDTO.builder()
                .id(highlight.getId())
                .postId(post == null ? null : post.getId())
                .postTitle(post == null ? null : post.getTitle())
                .articleId(article == null ? null : article.getId())
                .articleTitle(article == null ? null : article.getTitle())
                .channelName(post != null && post.getTopic() != null ? post.getTopic().getName() : null)
                .text(highlight.getText())
                .startOffset(highlight.getStartOffset())
                .endOffset(highlight.getEndOffset())
                .note(highlight.getNote())
                .createdAt(highlight.getCreatedAt())
                .updatedAt(highlight.getUpdatedAt())
                .build();
    }

    private ReadingProgressDTO toProgressDTO(ReadingProgress progress) {
        Post post = progress.getPost();
        Article article = progress.getArticle();
        return ReadingProgressDTO.builder()
                .id(progress.getId())
                .postId(post.getId())
                .title(post.getTitle())
                .articleId(article == null ? null : article.getId())
                .channelName(post.getTopic() == null ? null : post.getTopic().getName())
                .progress(progress.getProgress())
                .scrollY(progress.getScrollY())
                .updatedAt(progress.getUpdatedAt())
                .build();
    }
}
