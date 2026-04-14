package com.nanbu.alumni.service;

import com.nanbu.alumni.dto.SchoolDto;
import com.nanbu.alumni.entity.School;
import com.nanbu.alumni.repository.AlumniRepository;
import com.nanbu.alumni.repository.SchoolRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SchoolService {

    @Autowired
    private SchoolRepository schoolRepository;

    @Autowired
    private AlumniRepository alumniRepository;

    public List<SchoolDto> getAllSchools() {
        Map<String, Long> countMap = alumniRepository.countBySchool();
        
        return schoolRepository.findAll().stream()
                .map(school -> SchoolDto.fromEntity(school, countMap.getOrDefault(school.getName(), 0L)))
                .collect(Collectors.toList());
    }

    public SchoolDto getSchoolById(Long id) {
        School school = schoolRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("学校不存在"));
        return SchoolDto.fromEntity(school);
    }

    public SchoolDto getSchoolByName(String name) {
        School school = schoolRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("学校不存在"));
        return SchoolDto.fromEntity(school);
    }
}
