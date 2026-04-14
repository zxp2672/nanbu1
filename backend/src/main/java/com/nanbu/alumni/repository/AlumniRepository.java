package com.nanbu.alumni.repository;

import com.nanbu.alumni.entity.Alumni;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlumniRepository extends JpaRepository<Alumni, Long>, JpaSpecificationExecutor<Alumni> {
    
    List<Alumni> findByStatus(String status);
    
    List<Alumni> findBySchool(String school);
    
    List<Alumni> findBySchoolAndLevel(String school, String level);
    
    List<Alumni> findBySchoolAndLevelAndYear(String school, String level, Integer year);
    
    List<Alumni> findByUserId(Long userId);
    
    @Query("SELECT DISTINCT a.year FROM Alumni a WHERE (:school IS NULL OR a.school = :school) AND (:level IS NULL OR a.level = :level) AND a.year IS NOT NULL ORDER BY a.year DESC")
    List<Integer> findDistinctYears(@Param("school") String school, @Param("level") String level);
    
    @Query("SELECT DISTINCT a.classname FROM Alumni a WHERE (:school IS NULL OR a.school = :school) AND (:level IS NULL OR a.level = :level) AND (:year IS NULL OR a.year = :year) AND a.classname IS NOT NULL")
    List<String> findDistinctClasses(@Param("school") String school, @Param("level") String level, @Param("year") Integer year);
    
    @Query("SELECT a.school, COUNT(a) FROM Alumni a WHERE a.status = 'approved' GROUP BY a.school")
    List<Object[]> countBySchool();
    
    long countByStatus(String status);
}
