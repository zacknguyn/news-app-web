package com.nhatlam.redditnews.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.nhatlam.redditnews.dto.response.SavedArticleDTO;
import com.nhatlam.redditnews.entity.Article;
import com.nhatlam.redditnews.entity.SavedArticle;
import com.nhatlam.redditnews.entity.User;
import com.nhatlam.redditnews.exception.ResourceNotFoundException;
import com.nhatlam.redditnews.mapper.SavedArticleMapper;
import com.nhatlam.redditnews.repository.ArticleRepository;
import com.nhatlam.redditnews.repository.SavedArticleRepository;
import com.nhatlam.redditnews.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SavedArticleService {
    private final SavedArticleRepository savedArticleRepository;
    private final UserRepository userRepository;
    private final ArticleRepository articleRepository;
    private final SavedArticleMapper savedArticleMapper;

    public List<SavedArticleDTO> getSavedArticlesByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with id: " + userId);
        }
        List<SavedArticle> savedArticles = savedArticleRepository.findByUserIdOrderBySavedAtDesc(userId);
        return savedArticleMapper.toDTOList(savedArticles);
    }

    @Transactional
    public SavedArticleDTO saveArticle(Long userId, Long articleId) {
        if (savedArticleRepository.existsByUserIdAndArticleId(userId, articleId)) {
            throw new ResourceNotFoundException("Article already saved by this user");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        Article article = articleRepository.findById(articleId)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found with id: " + articleId));
        SavedArticle savedArticle = SavedArticle.builder().user(user).article(article).build();
        savedArticle = savedArticleRepository.save(savedArticle);
        return savedArticleMapper.toDTO(savedArticle);
    }

    @Transactional
    public void unsaveArticle(Long userId, Long articleId) {
        if (!savedArticleRepository.existsByUserIdAndArticleId(userId, articleId)) {
            throw new ResourceNotFoundException("Saved article relationship not found");
        }
        savedArticleRepository.deleteByUserIdAndArticleId(userId, articleId);
    }

    public boolean isArticleSavedByUser(Long userId, Long articleId) {
        return savedArticleRepository.existsByUserIdAndArticleId(userId, articleId);
    }
}
