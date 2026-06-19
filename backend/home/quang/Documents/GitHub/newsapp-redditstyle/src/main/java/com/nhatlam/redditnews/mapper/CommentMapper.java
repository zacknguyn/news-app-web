package com.nhatlam.redditnews.mapper;

import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.nhatlam.redditnews.dto.request.CommentCreateDTO;
import com.nhatlam.redditnews.dto.response.CommentDTO;
import com.nhatlam.redditnews.entity.Comment;

@Mapper(componentModel = "spring")
public interface CommentMapper {

    @Mapping(source = "article.id", target = "articleId")
    @Mapping(source = "post.id", target = "postId")
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "parent.id", target = "parentId")
    @Mapping(target = "likedByMe", ignore = true)
    CommentDTO toDTO(Comment entity);

    List<CommentDTO> toDTOList(List<Comment> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "article", ignore = true)
    @Mapping(target = "post", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "parent", ignore = true)
    @Mapping(target = "replies", ignore = true)
    @Mapping(target = "userName", ignore = true)
    @Mapping(target = "userAvatar", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "likes", constant = "0")
    Comment toEntity(CommentCreateDTO dto);
}
