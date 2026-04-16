package com.nanbu.alumni.repository;

import com.nanbu.alumni.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {
    
    List<Activity> findAllByOrderByStartTimeDesc();
    
    List<Activity> findByStartTimeAfterOrderByStartTimeDesc(LocalDateTime time);
    
    List<Activity> findByEndTimeBeforeOrderByStartTimeDesc(LocalDateTime time);
    
    @Query("SELECT a FROM Activity a WHERE a.startTime <= :now AND (a.endTime IS NULL OR a.endTime >= :now) ORDER BY a.startTime DESC")
    List<Activity> findOngoingActivities(@Param("now") LocalDateTime now);
    
    @Query("SELECT a FROM Activity a WHERE a.organizerId = :userId ORDER BY a.startTime DESC")
    List<Activity> findByOrganizerId(@Param("userId") Long userId);
}
