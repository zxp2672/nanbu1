package com.nanbu.alumni.controller;

import com.nanbu.alumni.dto.ApiResponse;
import com.nanbu.alumni.dto.UserDto;
import com.nanbu.alumni.entity.User;
import com.nanbu.alumni.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ApiResponse<List<UserDto>> getAllUsers() {
        return ApiResponse.success(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ApiResponse<UserDto> getUserById(@PathVariable Long id) {
        return ApiResponse.success(userService.getUserById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ApiResponse<UserDto> createUser(@RequestBody User user) {
        try {
            return ApiResponse.success(userService.createUser(user));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN') or #id == authentication.principal.username")
    public ApiResponse<UserDto> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            return ApiResponse.success(userService.updateUser(id, user));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPERADMIN')")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ApiResponse.success();
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/profile")
    public ApiResponse<UserDto> updateProfile(@AuthenticationPrincipal UserDetails userDetails, 
                                               @RequestBody User user) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.success(userService.updateUser(userId, user));
    }
}
