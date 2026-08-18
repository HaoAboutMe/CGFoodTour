package com.cangiuoc.cgfoodtour.controller;

import com.cangiuoc.cgfoodtour.constant.SuccessMessage;
import com.cangiuoc.cgfoodtour.dto.request.*;
import com.cangiuoc.cgfoodtour.dto.response.UserResponse;
import com.cangiuoc.cgfoodtour.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserController {
    UserService userService;

    @PostMapping("/users")
    public ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request) {
        ApiResponse<UserResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(userService.createUser(request));
        apiResponse.setMessage(SuccessMessage.REGISTER_SUCCESS);
        return apiResponse;
    }

    @GetMapping("/users")
    public ApiResponse<List<UserResponse>> getUsers() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        log.info("Username: {}", authentication.getName());
        log.info("Roles: {}", authentication.getAuthorities());

        ApiResponse<List<UserResponse>> apiResponse = new ApiResponse<>();
        apiResponse.setResult(userService.getUsers());
        apiResponse.setMessage(SuccessMessage.GET_ALL_USERS_SUCCESS);
        return apiResponse;
    }

    @GetMapping("/users/me")
    public ApiResponse<UserResponse> getCurrentUser() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getCurrentUser())
                .message(SuccessMessage.GET_USER_SUCCESS)
                .build();
    }

    @GetMapping("/users/{userId}")
    public ApiResponse<UserResponse> getUserById(@PathVariable("userId") String userId) {
        ApiResponse<UserResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(userService.getUserById(userId));
        apiResponse.setMessage(SuccessMessage.GET_USER_SUCCESS);
        return apiResponse;
    }

    @PutMapping("/users/{userId}")
    public ApiResponse<UserResponse> updateUser(@PathVariable("userId") String userId,
            @RequestBody UserUpdateRequest request) {
        ApiResponse<UserResponse> apiResponse = new ApiResponse<>();
        apiResponse.setResult(userService.updateUser(request, userId));
        apiResponse.setMessage(SuccessMessage.UPDATE_USER_SUCCESS);
        return apiResponse;
    }

    @PutMapping("/users/me")
    public ApiResponse<UserResponse> updateCurrentUser(@RequestBody MyInfoUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateMyInfo(request))
                .message(SuccessMessage.UPDATE_USER_SUCCESS)
                .build();
    }

    // Endpoint Change Password
    @PutMapping("/users/me/change-password")
    public ApiResponse<UserResponse> changePassword(@RequestBody ChangePasswordRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.changePassword(request))
                .message(SuccessMessage.CHANGE_PASSWORD_SUCCESS)
                .build();
    }

    @DeleteMapping("/users/{userId}")
    public ApiResponse<String> deleteUser(@PathVariable("userId") String userId) {
        ApiResponse<String> apiResponse = new ApiResponse<>();
        userService.deleteUser(userId);
        apiResponse.setResult("User deleted successfully!");
        apiResponse.setMessage(SuccessMessage.DELETE_USER_SUCCESS);
        return apiResponse;
    }
}
