package com.nanbu.alumni.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "alumni")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Alumni {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 50)
    private String school;

    @Column(length = 20)
    private String level;

    private Integer year;

    @Column(length = 50)
    private String classname;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String job;

    @Column(length = 100)
    private String company;

    @Column(length = 50)
    private String city;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 500)
    private String avatar;

    @Column(name = "user_id")
    private Long userId;

    @Column(length = 20)
    private String status = "pending";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    // 状态相关方法
    public boolean isApproved() {
        return "approved".equals(status);
    }

    public boolean isPending() {
        return "pending".equals(status);
    }

    public boolean isRejected() {
        return "rejected".equals(status);
    }
}
