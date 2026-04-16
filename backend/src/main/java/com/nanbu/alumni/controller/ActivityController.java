package com.nanbu.alumni.controller;

import com.nanbu.alumni.dto.ActivityDto;
import com.nanbu.alumni.dto.ActivitySignupDto;
import com.nanbu.alumni.dto.ApiResponse;
import com.nanbu.alumni.entity.Activity;
import com.nanbu.alumni.entity.ActivitySignup;
import com.nanbu.alumni.entity.User;
import com.nanbu.alumni.service.ActivityService;
import com.nanbu.alumni.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @Autowired
    private UserService userService;

    @GetMapping
    public ApiResponse<List<ActivityDto>> getAllActivities(@RequestParam(required = false) String status) {
        if (status != null && !status.isEmpty() && !"all".equals(status)) {
            return ApiResponse.success(activityService.getActivitiesByStatus(status));
        }
        return ApiResponse.success(activityService.getAllActivities());
    }

    @GetMapping("/{id}")
    public ApiResponse<ActivityDto> getActivityById(@PathVariable Long id) {
        return ApiResponse.success(activityService.getActivityById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'SCHOOL_ADMIN', 'GRADE_ADMIN', 'CLASS_ADMIN')")
    public ApiResponse<ActivityDto> createActivity(@RequestBody Activity activity,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        User user = userService.getUserById(userId);
        activity.setOrganizerId(userId);
        activity.setOrganizerName(user.getName() != null ? user.getName() : user.getUsername());
        return ApiResponse.success(activityService.createActivity(activity));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'SCHOOL_ADMIN', 'GRADE_ADMIN', 'CLASS_ADMIN')")
    public ApiResponse<ActivityDto> updateActivity(@PathVariable Long id, @RequestBody Activity activity) {
        return ApiResponse.success(activityService.updateActivity(id, activity));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPERADMIN', 'SCHOOL_ADMIN', 'GRADE_ADMIN', 'CLASS_ADMIN')")
    public ApiResponse<Void> deleteActivity(@PathVariable Long id) {
        activityService.deleteActivity(id);
        return ApiResponse.success();
    }

    @PostMapping("/{id}/signup")
    public ApiResponse<ActivitySignupDto> signupActivity(@PathVariable Long id,
                                                          @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        User user = userService.getUserById(userId);
        
        ActivitySignup signup = new ActivitySignup();
        signup.setUserId(userId);
        signup.setName(user.getName() != null ? user.getName() : user.getUsername());
        signup.setAvatar(user.getAvatar());
        signup.setSchool(user.getSchool());
        
        try {
            return ApiResponse.success(activityService.signupActivity(id, signup));
        } catch (RuntimeException e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<Void> cancelSignup(@PathVariable Long id,
                                          @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        activityService.cancelSignup(id, userId);
        return ApiResponse.success();
    }

    @GetMapping("/{id}/is-signed-up")
    public ApiResponse<Boolean> isUserSignedUp(@PathVariable Long id,
                                                @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.success(activityService.isUserSignedUp(id, userId));
    }

    @GetMapping("/my")
    public ApiResponse<List<ActivityDto>> getMyActivities(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.success(activityService.getActivitiesByUser(userId));
    }
}
