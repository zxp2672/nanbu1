package com.nanbu.alumni.dto;

import com.nanbu.alumni.entity.Alumni;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AlumniDto {
    private Long id;
    private String name;
    private String school;
    private String level;
    private Integer year;
    private String classname;
    private String phone;
    private String job;
    private String company;
    private String city;
    private String bio;
    private String avatar;
    private Long userId;
    private String status;
    private LocalDateTime createdAt;

    public static AlumniDto fromEntity(Alumni alumni) {
        if (alumni == null) return null;
        AlumniDto dto = new AlumniDto();
        dto.setId(alumni.getId());
        dto.setName(alumni.getName());
        dto.setSchool(alumni.getSchool());
        dto.setLevel(alumni.getLevel());
        dto.setYear(alumni.getYear());
        dto.setClassname(alumni.getClassname());
        dto.setPhone(alumni.getPhone());
        dto.setJob(alumni.getJob());
        dto.setCompany(alumni.getCompany());
        dto.setCity(alumni.getCity());
        dto.setBio(alumni.getBio());
        dto.setAvatar(alumni.getAvatar());
        dto.setUserId(alumni.getUserId());
        dto.setStatus(alumni.getStatus());
        dto.setCreatedAt(alumni.getCreatedAt());
        return dto;
    }
}
