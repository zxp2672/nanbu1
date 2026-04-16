package com.nanbu.alumni.dto;

import com.nanbu.alumni.entity.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserDto {
    private Long id;
    private String username;
    private String name;
    private String role;
    private String school;
    private String level;
    private Integer year;
    private String classname;
    private String job;
    private String city;
    private String bio;
    private String avatar;
    private LocalDateTime createdAt;

    public static UserDto fromEntity(User user) {
        if (user == null) return null;
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setName(user.getName());
        dto.setRole(user.getRole());
        dto.setSchool(user.getSchool());
        dto.setLevel(user.getLevel());
        dto.setYear(user.getYear());
        dto.setClassname(user.getClassname());
        dto.setJob(user.getJob());
        dto.setCity(user.getCity());
        dto.setBio(user.getBio());
        dto.setAvatar(user.getAvatar());
        dto.setCreatedAt(user.getCreatedAt());
        return dto;
    }
}
