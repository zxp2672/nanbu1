package com.nanbu.alumni.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_signups",
       uniqueConstraints = @UniqueConstraint(columnNames = {"activity_id", "user_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivitySignup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "activity_id", nullable = false)
    private Long activityId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 50)
    private String name;

    @Column(length = 500)
    private String avatar;

    @Column(length = 50)
    private String school;

    @CreationTimestamp
    @Column(name = "signed_at", updatable = false)
    private LocalDateTime signedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", insertable = false, updatable = false)
    private Activity activity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
}
