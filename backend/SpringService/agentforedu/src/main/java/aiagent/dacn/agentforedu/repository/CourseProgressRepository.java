package aiagent.dacn.agentforedu.repository;

import aiagent.dacn.agentforedu.entity.CourseProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseProgressRepository extends JpaRepository<CourseProgress, Long> {

    Optional<CourseProgress> findByUserIdAndCourseId(Long userId, Long courseId);

    List<CourseProgress> findByUserId(Long userId);

    List<CourseProgress> findByCourseId(Long courseId);
    
    @Modifying
    @Query("DELETE FROM CourseProgress cp WHERE cp.courseId = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);
}