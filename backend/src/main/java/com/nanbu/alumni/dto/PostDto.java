package com.nanbu.alumni.dto;

import com.nanbu.alumni.entity.Post;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PostDto {
    private Long id;
    private String content;
    private String image;
    private String author;
    private Long authorId;
    private String school;
    private String avatar;
    private LocalDateTime createdAt;

    public static PostDto fromEntity(Post post) {
        if (post == null) return null;
        PostDto dto = new PostDto();
        dto.setId(post.getId());
        dto.setContent(post.getContent());
        dto.setImage(post.getImage());
        dto.setAuthor(post.getAuthor());
        dto.setAuthorId(post.getAuthorId());
        dto.setSchool(post.getSchool());
        dto.setAvatar(post.getAvatar());
        dto.setCreatedAt(post.getCreatedAt());
        return dto;
    }
}
