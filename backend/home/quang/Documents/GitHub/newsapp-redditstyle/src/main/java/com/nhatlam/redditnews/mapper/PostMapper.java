package com.nhatlam.redditnews.mapper;

import java.util.List;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import com.nhatlam.redditnews.dto.response.PostDTO;
import com.nhatlam.redditnews.entity.Post;

@Mapper(componentModel = "spring")
public interface PostMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.name", target = "authorName")
    @Mapping(source = "topic.id", target = "topicId")
    @Mapping(source = "topic.name", target = "topicName")
    @Mapping(source = "article.id", target = "articleId")
    @Mapping(target = "savedByMe", ignore = true)
    PostDTO toDTO(Post entity);

    List<PostDTO> toDTOList(List<Post> entities);
}
