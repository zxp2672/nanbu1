package com.nanbu.alumni.repository;

import com.nanbu.alumni.entity.Resource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    
    List<Resource> findByTypeOrderByCreatedAtDesc(String type);
    
    List<Resource> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
    
    List<Resource> findAllByOrderByCreatedAtDesc();
}
