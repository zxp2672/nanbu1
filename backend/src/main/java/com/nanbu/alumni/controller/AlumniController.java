package com.nanbu.alumni.controller;

import com.nanbu.alumni.dto.AlumniDto;
import com.nanbu.alumni.dto.ApiResponse;
import com.nanbu.alumni.dto.UserDto;
import com.nanbu.alumni.entity.Alumni;
import com.nanbu.alumni.entity.User;
import com.nanbu.alumni.service.AlumniService;
import com.nanbu.alumni.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alumni")
public class AlumniController {

    @Autowired
    private AlumniService alumniService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ApiResponse<List<AlumniDto>> getAllAlumni(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String school,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String classname) {
        
        if (keyword != null || school != null || level != null || year != null || classname != null) {
            return ApiResponse.success(alumniService.searchAlumni(keyword, school, level, year, classname));
        }
        return ApiResponse.success(alumniService.getApprovedAlumni());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'SCHOOL_ADMIN', 'GRADE_ADMIN', 'CLASS_ADMIN')")
    public ApiResponse<List<AlumniDto>> getPendingAlumni(@AuthenticationPrincipal UserDetails userDetails) {
        // 这里应该根据用户权限过滤，简化处理
        return ApiResponse.success(alumniService.getPendingAlumni());
    }

    @GetMapping("/{id}")
    public ApiResponse<AlumniDto> getAlumniById(@PathVariable Long id) {
        return ApiResponse.success(alumniService.getAlumniById(id));
    }

    @PostMapping
    public ApiResponse<AlumniDto> createAlumni(@RequestBody Alumni alumni,
                                                @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails != null) {
            Long userId = Long.parseLong(userDetails.getUsername());
            alumni.setUserId(userId);
        }
        return ApiResponse.success(alumniService.createAlumni(alumni));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'SCHOOL_ADMIN', 'GRADE_ADMIN', 'CLASS_ADMIN')")
    public ApiResponse<AlumniDto> updateAlumni(@PathVariable Long id, @RequestBody Alumni alumni) {
        return ApiResponse.success(alumniService.updateAlumni(id, alumni));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'SCHOOL_ADMIN', 'GRADE_ADMIN', 'CLASS_ADMIN')")
    public ApiResponse<Void> deleteAlumni(@PathVariable Long id) {
        alumniService.deleteAlumni(id);
        return ApiResponse.success();
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'SCHOOL_ADMIN', 'GRADE_ADMIN', 'CLASS_ADMIN')")
    public ApiResponse<AlumniDto> approveAlumni(@PathVariable Long id) {
        return ApiResponse.success(alumniService.approveAlumni(id));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'SCHOOL_ADMIN', 'GRADE_ADMIN', 'CLASS_ADMIN')")
    public ApiResponse<AlumniDto> rejectAlumni(@PathVariable Long id) {
        return ApiResponse.success(alumniService.rejectAlumni(id));
    }

    @GetMapping("/years")
    public ApiResponse<List<Integer>> getYears(
            @RequestParam(required = false) String school,
            @RequestParam(required = false) String level) {
        return ApiResponse.success(alumniService.getYears(school, level));
    }

    @GetMapping("/classes")
    public ApiResponse<List<String>> getClasses(
            @RequestParam(required = false) String school,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Integer year) {
        return ApiResponse.success(alumniService.getClasses(school, level, year));
    }

    @GetMapping("/stats/by-school")
    public ApiResponse<Map<String, Long>> getAlumniCountBySchool() {
        return ApiResponse.success(alumniService.getAlumniCountBySchool());
    }

    @GetMapping("/stats/count")
    public ApiResponse<Map<String, Long>> getAlumniCounts() {
        return ApiResponse.success(Map.of(
                "pending", alumniService.countPending(),
                "approved", alumniService.countApproved()
        ));
    }
}
