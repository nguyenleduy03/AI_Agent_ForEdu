package aiagent.dacn.agentforedu.repository;

import aiagent.dacn.agentforedu.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    Optional<LessonProgress> findByUserIdAndLessonId(Long userId, Long lessonId);

    List<LessonProgress> findByUserIdAndCourseId(Long userId, Long courseId);

    List<LessonProgress> findByUserId(Long userId);

    List<LessonProgress> findByLessonId(Long lessonId);

    List<LessonProgress> findByCourseId(Long courseId);
    
    @Modifying
    @Query("DELETE FROM LessonProgress lp WHERE lp.lessonId = :lessonId")
    void deleteByLessonId(@Param("lessonId") Long lessonId);
    
    @Modifying
    @Query("DELETE FROM LessonProgress lp WHERE lp.courseId = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT lp FROM LessonProgress lp WHERE lp.userId = :userId AND lp.courseId = :courseId AND lp.isCompleted = true")
    List<LessonProgress> findCompletedLessonsByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);

    @Query("SELECT COUNT(lp) FROM LessonProgress lp WHERE lp.userId = :userId AND lp.courseId = :courseId AND lp.isCompleted = true")
    Long countCompletedLessonsByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);

    @Query("SELECT SUM(lp.timeSpent) FROM LessonProgress lp WHERE lp.userId = :userId AND lp.courseId = :courseId")
    Integer sumTimeSpentByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);
}