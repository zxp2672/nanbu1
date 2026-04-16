package com.nanbu.alumni.controller;

import com.nanbu.alumni.dto.ApiResponse;
import com.nanbu.alumni.dto.PostDto;
import com.nanbu.alumni.entity.Post;
import com.nanbu.alumni.entity.User;
import com.nanbu.alumni.service.PostService;
import com.nanbu.alumni.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostService postService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ApiResponse<List<PostDto>> getAllPosts() {
        return ApiResponse.success(postService.getAllPosts());
    }

    @GetMapping("/recent")
    public ApiResponse<List<PostDto>> getRecentPosts(@RequestParam(defaultValue = "5") int limit) {
        return ApiResponse.success(postService.getRecentPosts(limit));
    }

    @GetMapping("/{id}")
    public ApiResponse<PostDto> getPostById(@PathVariable Long id) {
        return ApiResponse.success(postService.getPostById(id));
    }

    @PostMapping
    public ApiResponse<PostDto> createPost(@RequestBody Post post,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        User user = userService.getUserById(userId);
        
        post.setAuthorId(userId);
        post.setAuthor(user.getName() != null ? user.getName() : user.getUsername());
        post.setSchool(user.getSchool());
        post.setAvatar(user.getAvatar());
        
        return ApiResponse.success(postService.createPost(post));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deletePost(@PathVariable Long id,
                                        @AuthenticationPrincipal UserDetails userDetails) {
        // 可以添加权限检查，确保只能删除自己的动态
        postService.deletePost(id);
        return ApiResponse.success();
    }

    @GetMapping("/my")
    public ApiResponse<List<PostDto>> getMyPosts(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.success(postService.getPostsByUser(userId));
    }
}
