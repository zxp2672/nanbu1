package com.nanbu.alumni.controller;

import com.nanbu.alumni.dto.ApiResponse;
import com.nanbu.alumni.dto.LoginRequest;
import com.nanbu.alumni.dto.LoginResponse;
import com.nanbu.alumni.dto.UserDto;
import com.nanbu.alumni.security.JwtUtil;
import com.nanbu.alumni.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = authService.login(request);
            return ApiResponse.success(response);
        } catch (RuntimeException e) {
            return ApiResponse.error(401, e.getMessage());
        }
    }

    @GetMapping("/me")
    public ApiResponse<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ApiResponse.error(401, "未登录");
        }
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.success(authService.getCurrentUser(userId));
    }
}
