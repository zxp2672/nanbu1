package com.nanbu.alumni.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "activities")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(length = 200)
    private String location;

    private Integer capacity = 0;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "organizer_name", length = 50)
    private String organizerName;

    @Column(name = "organizer_id")
    private Long organizerId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organizer_id", insertable = false, updatable = false)
    private User organizer;

    @OneToMany(mappedBy = "activity", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ActivitySignup> signups = new ArrayList<>();

    // 获取活动状态
    public String getStatus() {
        LocalDateTime now = LocalDateTime.now();
        if (startTime != null && now.isBefore(startTime)) {
            return "upcoming";
        }
        if (endTime != null && now.isAfter(endTime)) {
            return "ended";
        }
        return "ongoing";
    }

    // 检查是否已满
    public boolean isFull() {
        return capacity > 0 && signups != null && signups.size() >= capacity;
    }

    // 获取报名人数
    public int getSignupCount() {
        return signups != null ? signups.size() : 0;
    }

    // 检查用户是否已报名
    public boolean isUserSignedUp(Long userId) {
        return signups != null && signups.stream()
                .anyMatch(s -> s.getUserId().equals(userId));
    }
}
