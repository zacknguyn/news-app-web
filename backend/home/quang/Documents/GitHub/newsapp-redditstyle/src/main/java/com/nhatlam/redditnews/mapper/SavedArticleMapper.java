package com.nhatlam.redditnews.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.nhatlam.redditnews.dto.response.SavedArticleDTO;
import com.nhatlam.redditnews.entity.SavedArticle;

@Mapper(componentModel = "spring", uses = {ArticleMapper.class})
public interface SavedArticleMapper {

    @Mapping(source = "article", target = "article")
    SavedArticleDTO toDTO(SavedArticle entity);

    List<SavedArticleDTO> toDTOList(List<SavedArticle> entities);
}
