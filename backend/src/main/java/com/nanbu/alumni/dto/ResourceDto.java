package com.nanbu.alumni.dto;

import com.nanbu.alumni.entity.Resource;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ResourceDto {
    private Long id;
    private String title;
    private String type;
    private String description;
    private String contact;
    private String author;
    private Long authorId;
    private LocalDateTime createdAt;

    public static ResourceDto fromEntity(Resource resource) {
        if (resource == null) return null;
        ResourceDto dto = new ResourceDto();
        dto.setId(resource.getId());
        dto.setTitle(resource.getTitle());
        dto.setType(resource.getType());
        dto.setDescription(resource.getDescription());
        dto.setContact(resource.getContact());
        dto.setAuthor(resource.getAuthor());
        dto.setAuthorId(resource.getAuthorId());
        dto.setCreatedAt(resource.getCreatedAt());
        return dto;
    }
}
