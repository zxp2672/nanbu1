package com.nanbu.alumni.service;

import com.nanbu.alumni.dto.PostDto;
import com.nanbu.alumni.entity.Post;
import com.nanbu.alumni.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    public List<PostDto> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(PostDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<PostDto> getRecentPosts(int limit) {
        return postRepository.findAllByOrderByCreatedAtDesc().stream()
                .limit(limit)
                .map(PostDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<PostDto> getPostsByUser(Long userId) {
        return postRepository.findByAuthorIdOrderByCreatedAtDesc(userId).stream()
                .map(PostDto::fromEntity)
                .collect(Collectors.toList());
    }

    public PostDto getPostById(Long id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("动态不存在"));
        return PostDto.fromEntity(post);
    }

    @Transactional
    public PostDto createPost(Post post) {
        Post saved = postRepository.save(post);
        return PostDto.fromEntity(saved);
    }

    @Transactional
    public void deletePost(Long id) {
        postRepository.deleteById(id);
    }
}
