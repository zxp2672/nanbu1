package com.nanbu.alumni.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "schools")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class School {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "short_name", length = 20)
    private String shortName;

    @Column(length = 10)
    private String icon = "🏫";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "founded_year")
    private Integer foundedYear;

    @Column(length = 20)
    private String color = "#1a6fc4";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
