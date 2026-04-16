package com.nanbu.alumni.dto;

import com.nanbu.alumni.entity.School;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SchoolDto {
    private Long id;
    private String name;
    private String shortName;
    private String icon;
    private String description;
    private Integer foundedYear;
    private String color;
    private Long alumniCount;
    private LocalDateTime createdAt;

    public static SchoolDto fromEntity(School school) {
        if (school == null) return null;
        SchoolDto dto = new SchoolDto();
        dto.setId(school.getId());
        dto.setName(school.getName());
        dto.setShortName(school.getShortName());
        dto.setIcon(school.getIcon());
        dto.setDescription(school.getDescription());
        dto.setFoundedYear(school.getFoundedYear());
        dto.setColor(school.getColor());
        dto.setCreatedAt(school.getCreatedAt());
        return dto;
    }

    public static SchoolDto fromEntity(School school, Long alumniCount) {
        SchoolDto dto = fromEntity(school);
        if (dto != null) {
            dto.setAlumniCount(alumniCount);
        }
        return dto;
    }
}
