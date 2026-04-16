package com.nanbu.alumni.controller;

import com.nanbu.alumni.dto.ApiResponse;
import com.nanbu.alumni.dto.ResourceDto;
import com.nanbu.alumni.entity.Resource;
import com.nanbu.alumni.service.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    @Autowired
    private ResourceService resourceService;

    @GetMapping
    public ApiResponse<List<ResourceDto>> getAllResources(@RequestParam(required = false) String type) {
        return ApiResponse.success(resourceService.getResourcesByType(type));
    }

    @GetMapping("/{id}")
    public ApiResponse<ResourceDto> getResourceById(@PathVariable Long id) {
        return ApiResponse.success(resourceService.getResourceById(id));
    }

    @PostMapping
    public ApiResponse<ResourceDto> createResource(@RequestBody Resource resource,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails != null) {
            Long userId = Long.parseLong(userDetails.getUsername());
            resource.setAuthorId(userId);
        }
        return ApiResponse.success(resourceService.createResource(resource));
    }

    @PutMapping("/{id}")
    public ApiResponse<ResourceDto> updateResource(@PathVariable Long id, @RequestBody Resource resource) {
        return ApiResponse.success(resourceService.updateResource(id, resource));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ApiResponse.success();
    }

    @GetMapping("/my")
    public ApiResponse<List<ResourceDto>> getMyResources(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.success(resourceService.getResourcesByUser(userId));
    }
}
