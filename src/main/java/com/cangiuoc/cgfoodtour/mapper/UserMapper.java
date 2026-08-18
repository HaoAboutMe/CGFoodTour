package com.cangiuoc.cgfoodtour.mapper;

import com.cangiuoc.cgfoodtour.dto.request.MyInfoUpdateRequest;
import com.cangiuoc.cgfoodtour.dto.request.UserCreationRequest;
import com.cangiuoc.cgfoodtour.dto.request.UserUpdateRequest;
import com.cangiuoc.cgfoodtour.dto.response.UserResponse;
import com.cangiuoc.cgfoodtour.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

import java.util.List;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper
{
    User toUser(UserCreationRequest request);
    UserResponse toUserResponse(User user);
    List<UserResponse> toListUserResponse(List<User> users);

    @Mapping(target = "roles", ignore = true)
    void updateUser(@MappingTarget User user, UserUpdateRequest request);

    @Mapping(target = "roles", ignore = true)
    void updateMyInfo(@MappingTarget User user, MyInfoUpdateRequest request);
}
