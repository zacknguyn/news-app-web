package com.nhatlam.redditnews.mapper;

import com.nhatlam.redditnews.dto.request.TopicCreateDTO;
import com.nhatlam.redditnews.dto.response.TopicDTO;
import com.nhatlam.redditnews.entity.Topic;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface TopicMapper {

    TopicDTO toDTO(Topic entity);

    List<TopicDTO> toDTOList(List<Topic> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "slug", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "memberCount", ignore = true)
    @Mapping(target = "postCount", ignore = true)
    @Mapping(target = "memberships", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Topic toEntity(TopicCreateDTO dto);
}
