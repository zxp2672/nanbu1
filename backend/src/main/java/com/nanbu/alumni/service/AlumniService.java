package com.nanbu.alumni.service;

import com.nanbu.alumni.dto.AlumniDto;
import com.nanbu.alumni.entity.Alumni;
import com.nanbu.alumni.entity.User;
import com.nanbu.alumni.repository.AlumniRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AlumniService {

    @Autowired
    private AlumniRepository alumniRepository;

    public List<AlumniDto> getAllAlumni() {
        return alumniRepository.findAll().stream()
                .map(AlumniDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<AlumniDto> getApprovedAlumni() {
        return alumniRepository.findByStatus("approved").stream()
                .map(AlumniDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<AlumniDto> getPendingAlumni() {
        return alumniRepository.findByStatus("pending").stream()
                .map(AlumniDto::fromEntity)
                .collect(Collectors.toList());
    }

    public AlumniDto getAlumniById(Long id) {
        Alumni alumni = alumniRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("校友不存在"));
        return AlumniDto.fromEntity(alumni);
    }

    public List<AlumniDto> searchAlumni(String keyword, String school, String level, Integer year, String classname) {
        Specification<Alumni> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // 默认只查询已通过的
            predicates.add(cb.equal(root.get("status"), "approved"));
            
            if (keyword != null && !keyword.isEmpty()) {
                String likePattern = "%" + keyword.toLowerCase() + "%";
                Predicate namePredicate = cb.like(cb.lower(root.get("name")), likePattern);
                Predicate jobPredicate = cb.like(cb.lower(root.get("job")), likePattern);
                Predicate companyPredicate = cb.like(cb.lower(root.get("company")), likePattern);
                Predicate cityPredicate = cb.like(cb.lower(root.get("city")), likePattern);
                predicates.add(cb.or(namePredicate, jobPredicate, companyPredicate, cityPredicate));
            }
            
            if (school != null && !school.isEmpty()) {
                predicates.add(cb.equal(root.get("school"), school));
            }
            if (level != null && !level.isEmpty()) {
                predicates.add(cb.equal(root.get("level"), level));
            }
            if (year != null) {
                predicates.add(cb.equal(root.get("year"), year));
            }
            if (classname != null && !classname.isEmpty()) {
                predicates.add(cb.equal(root.get("classname"), classname));
            }
            
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        
        return alumniRepository.findAll(spec).stream()
                .map(AlumniDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AlumniDto createAlumni(Alumni alumni) {
        alumni.setStatus("pending");
        Alumni saved = alumniRepository.save(alumni);
        return AlumniDto.fromEntity(saved);
    }

    @Transactional
    public AlumniDto updateAlumni(Long id, Alumni alumniUpdate) {
        Alumni alumni = alumniRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("校友不存在"));
        
        if (alumniUpdate.getName() != null) alumni.setName(alumniUpdate.getName());
        if (alumniUpdate.getSchool() != null) alumni.setSchool(alumniUpdate.getSchool());
        if (alumniUpdate.getLevel() != null) alumni.setLevel(alumniUpdate.getLevel());
        if (alumniUpdate.getYear() != null) alumni.setYear(alumniUpdate.getYear());
        if (alumniUpdate.getClassname() != null) alumni.setClassname(alumniUpdate.getClassname());
        if (alumniUpdate.getPhone() != null) alumni.setPhone(alumniUpdate.getPhone());
        if (alumniUpdate.getJob() != null) alumni.setJob(alumniUpdate.getJob());
        if (alumniUpdate.getCompany() != null) alumni.setCompany(alumniUpdate.getCompany());
        if (alumniUpdate.getCity() != null) alumni.setCity(alumniUpdate.getCity());
        if (alumniUpdate.getBio() != null) alumni.setBio(alumniUpdate.getBio());
        if (alumniUpdate.getAvatar() != null) alumni.setAvatar(alumniUpdate.getAvatar());
        if (alumniUpdate.getUserId() != null) alumni.setUserId(alumniUpdate.getUserId());
        
        Alumni saved = alumniRepository.save(alumni);
        return AlumniDto.fromEntity(saved);
    }

    @Transactional
    public void deleteAlumni(Long id) {
        alumniRepository.deleteById(id);
    }

    @Transactional
    public AlumniDto approveAlumni(Long id) {
        Alumni alumni = alumniRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("校友不存在"));
        alumni.setStatus("approved");
        Alumni saved = alumniRepository.save(alumni);
        return AlumniDto.fromEntity(saved);
    }

    @Transactional
    public AlumniDto rejectAlumni(Long id) {
        Alumni alumni = alumniRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("校友不存在"));
        alumni.setStatus("rejected");
        Alumni saved = alumniRepository.save(alumni);
        return AlumniDto.fromEntity(saved);
    }

    public List<Integer> getYears(String school, String level) {
        return alumniRepository.findDistinctYears(school, level);
    }

    public List<String> getClasses(String school, String level, Integer year) {
        return alumniRepository.findDistinctClasses(school, level, year);
    }

    public Map<String, Long> getAlumniCountBySchool() {
        List<Object[]> results = alumniRepository.countBySchool();
        return results.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));
    }

    public long countPending() {
        return alumniRepository.countByStatus("pending");
    }

    public long countApproved() {
        return alumniRepository.countByStatus("approved");
    }
}
