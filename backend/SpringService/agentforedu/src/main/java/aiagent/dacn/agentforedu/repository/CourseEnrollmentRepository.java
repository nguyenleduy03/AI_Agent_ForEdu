package aiagent.dacn.agentforedu.repository;

import aiagent.dacn.agentforedu.entity.CourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {
    
    boolean existsByUserIdAndCourseId(Long userId, Long courseId);
    
    Optional<CourseEnrollment> findByUserIdAndCourseId(Long userId, Long courseId);
    
    List<CourseEnrollment> findByUserId(Long userId);
    
    List<CourseEnrollment> findByCourseId(Long courseId);
    
    long countByCourseId(Long courseId);
    
    @Modifying
    @Query("DELETE FROM CourseEnrollment ce WHERE ce.courseId = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);
}
