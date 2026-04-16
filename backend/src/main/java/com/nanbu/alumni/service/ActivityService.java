package com.nanbu.alumni.service;

import com.nanbu.alumni.dto.ActivityDto;
import com.nanbu.alumni.dto.ActivitySignupDto;
import com.nanbu.alumni.entity.Activity;
import com.nanbu.alumni.entity.ActivitySignup;
import com.nanbu.alumni.repository.ActivityRepository;
import com.nanbu.alumni.repository.ActivitySignupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityService {

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private ActivitySignupRepository activitySignupRepository;

    public List<ActivityDto> getAllActivities() {
        return activityRepository.findAllByOrderByStartTimeDesc().stream()
                .map(ActivityDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ActivityDto> getActivitiesByStatus(String status) {
        LocalDateTime now = LocalDateTime.now();
        List<Activity> activities;
        
        switch (status) {
            case "upcoming":
                activities = activityRepository.findByStartTimeAfterOrderByStartTimeDesc(now);
                break;
            case "ongoing":
                activities = activityRepository.findOngoingActivities(now);
                break;
            case "ended":
                activities = activityRepository.findByEndTimeBeforeOrderByStartTimeDesc(now);
                break;
            default:
                activities = activityRepository.findAllByOrderByStartTimeDesc();
        }
        
        return activities.stream()
                .map(ActivityDto::fromEntity)
                .collect(Collectors.toList());
    }

    public ActivityDto getActivityById(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("活动不存在"));
        return ActivityDto.fromEntity(activity);
    }

    @Transactional
    public ActivityDto createActivity(Activity activity) {
        activity.setSignups(new java.util.ArrayList<>());
        Activity saved = activityRepository.save(activity);
        return ActivityDto.fromEntity(saved);
    }

    @Transactional
    public ActivityDto updateActivity(Long id, Activity activityUpdate) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("活动不存在"));
        
        if (activityUpdate.getName() != null) activity.setName(activityUpdate.getName());
        if (activityUpdate.getStartTime() != null) activity.setStartTime(activityUpdate.getStartTime());
        if (activityUpdate.getEndTime() != null) activity.setEndTime(activityUpdate.getEndTime());
        if (activityUpdate.getLocation() != null) activity.setLocation(activityUpdate.getLocation());
        if (activityUpdate.getCapacity() != null) activity.setCapacity(activityUpdate.getCapacity());
        if (activityUpdate.getDescription() != null) activity.setDescription(activityUpdate.getDescription());
        
        Activity saved = activityRepository.save(activity);
        return ActivityDto.fromEntity(saved);
    }

    @Transactional
    public void deleteActivity(Long id) {
        activityRepository.deleteById(id);
    }

    @Transactional
    public ActivitySignupDto signupActivity(Long activityId, ActivitySignup signup) {
        Activity activity = activityRepository.findById(activityId)
                .orElseThrow(() -> new RuntimeException("活动不存在"));
        
        if (activity.isFull()) {
            throw new RuntimeException("活动名额已满");
        }
        
        if (activitySignupRepository.existsByActivityIdAndUserId(activityId, signup.getUserId())) {
            throw new RuntimeException("您已经报名了该活动");
        }
        
        signup.setActivityId(activityId);
        signup.setSignedAt(LocalDateTime.now());
        ActivitySignup saved = activitySignupRepository.save(signup);
        return ActivitySignupDto.fromEntity(saved);
    }

    @Transactional
    public void cancelSignup(Long activityId, Long userId) {
        activitySignupRepository.deleteByActivityIdAndUserId(activityId, userId);
    }

    public boolean isUserSignedUp(Long activityId, Long userId) {
        return activitySignupRepository.existsByActivityIdAndUserId(activityId, userId);
    }

    public List<ActivityDto> getActivitiesByUser(Long userId) {
        return activityRepository.findByOrganizerId(userId).stream()
                .map(ActivityDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ActivitySignupDto> getUserSignups(Long userId) {
        return activitySignupRepository.findByUserIdOrderBySignedAtDesc(userId).stream()
                .map(ActivitySignupDto::fromEntity)
                .collect(Collectors.toList());
    }
}
