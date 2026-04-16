package com.nanbu.alumni.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(length = 50)
    private String name;

    @Column(nullable = false, length = 20)
    private String role = "user";

    @Column(length = 50)
    private String school;

    @Column(length = 20)
    private String level;

    private Integer year;

    @Column(length = 50)
    private String classname;

    @Column(length = 100)
    private String job;

    @Column(length = 50)
    private String city;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 500)
    private String avatar;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 权限相关方法
    public boolean isSuperAdmin() {
        return "superadmin".equals(role);
    }

    public boolean isAnyAdmin() {
        return isSuperAdmin() || "school_admin".equals(role) 
                || "grade_admin".equals(role) || "class_admin".equals(role);
    }

    public boolean isSchoolAdmin() {
        return "school_admin".equals(role);
    }

    public boolean isGradeAdmin() {
        return "grade_admin".equals(role);
    }

    public boolean isClassAdmin() {
        return "class_admin".equals(role);
    }
}
