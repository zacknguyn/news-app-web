package com.nhatlam.redditnews.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.nhatlam.redditnews.dto.response.UserDTO;
import com.nhatlam.redditnews.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "entitlements", ignore = true)
    UserDTO toDTO(User entity);

    List<UserDTO> toDTOList(List<User> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "savedArticles", ignore = true)
    @Mapping(target = "comments", ignore = true)
    void updateEntityFromDTO(UserDTO dto, @MappingTarget User entity);
}
