package com.nanbu.alumni.repository;

import com.nanbu.alumni.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    
    List<Post> findAllByOrderByCreatedAtDesc();
    
    List<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
    
    List<Post> findTop5ByOrderByCreatedAtDesc();
}
