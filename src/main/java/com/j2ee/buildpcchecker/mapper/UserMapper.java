package com.j2ee.buildpcchecker.mapper;

import com.j2ee.buildpcchecker.dto.request.MyInfoUpdateRequest;
import com.j2ee.buildpcchecker.dto.request.UserCreationRequest;
import com.j2ee.buildpcchecker.dto.request.UserUpdateRequest;
import com.j2ee.buildpcchecker.dto.response.UserResponse;
import com.j2ee.buildpcchecker.entity.User;
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
