package com.nanbu.alumni.service;

import com.nanbu.alumni.dto.ResourceDto;
import com.nanbu.alumni.entity.Resource;
import com.nanbu.alumni.repository.ResourceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ResourceService {

    @Autowired
    private ResourceRepository resourceRepository;

    public List<ResourceDto> getAllResources() {
        return resourceRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(ResourceDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ResourceDto> getResourcesByType(String type) {
        if (type == null || type.isEmpty() || "all".equals(type)) {
            return getAllResources();
        }
        return resourceRepository.findByTypeOrderByCreatedAtDesc(type).stream()
                .map(ResourceDto::fromEntity)
                .collect(Collectors.toList());
    }

    public ResourceDto getResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("资源不存在"));
        return ResourceDto.fromEntity(resource);
    }

    @Transactional
    public ResourceDto createResource(Resource resource) {
        Resource saved = resourceRepository.save(resource);
        return ResourceDto.fromEntity(saved);
    }

    @Transactional
    public ResourceDto updateResource(Long id, Resource resourceUpdate) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("资源不存在"));
        
        if (resourceUpdate.getTitle() != null) resource.setTitle(resourceUpdate.getTitle());
        if (resourceUpdate.getType() != null) resource.setType(resourceUpdate.getType());
        if (resourceUpdate.getDescription() != null) resource.setDescription(resourceUpdate.getDescription());
        if (resourceUpdate.getContact() != null) resource.setContact(resourceUpdate.getContact());
        
        Resource saved = resourceRepository.save(resource);
        return ResourceDto.fromEntity(saved);
    }

    @Transactional
    public void deleteResource(Long id) {
        resourceRepository.deleteById(id);
    }

    public List<ResourceDto> getResourcesByUser(Long userId) {
        return resourceRepository.findByAuthorIdOrderByCreatedAtDesc(userId).stream()
                .map(ResourceDto::fromEntity)
                .collect(Collectors.toList());
    }
}
