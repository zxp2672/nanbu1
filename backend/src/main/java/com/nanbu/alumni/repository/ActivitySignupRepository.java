package com.nanbu.alumni.repository;

import com.nanbu.alumni.entity.ActivitySignup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ActivitySignupRepository extends JpaRepository<ActivitySignup, Long> {
    
    List<ActivitySignup> findByActivityIdOrderBySignedAtAsc(Long activityId);
    
    List<ActivitySignup> findByUserIdOrderBySignedAtDesc(Long userId);
    
    Optional<ActivitySignup> findByActivityIdAndUserId(Long activityId, Long userId);
    
    boolean existsByActivityIdAndUserId(Long activityId, Long userId);
    
    long countByActivityId(Long activityId);
    
    void deleteByActivityIdAndUserId(Long activityId, Long userId);
}
