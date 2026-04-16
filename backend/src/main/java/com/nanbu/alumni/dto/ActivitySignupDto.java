package com.nanbu.alumni.dto;

import com.nanbu.alumni.entity.ActivitySignup;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ActivitySignupDto {
    private Long id;
    private Long activityId;
    private Long userId;
    private String name;
    private String avatar;
    private String school;
    private LocalDateTime signedAt;

    public static ActivitySignupDto fromEntity(ActivitySignup signup) {
        if (signup == null) return null;
        ActivitySignupDto dto = new ActivitySignupDto();
        dto.setId(signup.getId());
        dto.setActivityId(signup.getActivityId());
        dto.setUserId(signup.getUserId());
        dto.setName(signup.getName());
        dto.setAvatar(signup.getAvatar());
        dto.setSchool(signup.getSchool());
        dto.setSignedAt(signup.getSignedAt());
        return dto;
    }
}
