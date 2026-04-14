package com.nanbu.alumni.dto;

import com.nanbu.alumni.entity.Activity;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class ActivityDto {
    private Long id;
    private String name;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    private Integer capacity;
    private String description;
    private String organizerName;
    private Long organizerId;
    private String status;
    private int signupCount;
    private boolean isFull;
    private List<ActivitySignupDto> signups;
    private LocalDateTime createdAt;

    public static ActivityDto fromEntity(Activity activity) {
        if (activity == null) return null;
        ActivityDto dto = new ActivityDto();
        dto.setId(activity.getId());
        dto.setName(activity.getName());
        dto.setStartTime(activity.getStartTime());
        dto.setEndTime(activity.getEndTime());
        dto.setLocation(activity.getLocation());
        dto.setCapacity(activity.getCapacity());
        dto.setDescription(activity.getDescription());
        dto.setOrganizerName(activity.getOrganizerName());
        dto.setOrganizerId(activity.getOrganizerId());
        dto.setStatus(activity.getStatus());
        dto.setSignupCount(activity.getSignupCount());
        dto.setFull(activity.isFull());
        if (activity.getSignups() != null) {
            dto.setSignups(activity.getSignups().stream()
                    .map(ActivitySignupDto::fromEntity)
                    .collect(Collectors.toList()));
        }
        dto.setCreatedAt(activity.getCreatedAt());
        return dto;
    }
}
