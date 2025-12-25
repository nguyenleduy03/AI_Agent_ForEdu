package aiagent.dacn.agentforedu.repository;

import aiagent.dacn.agentforedu.entity.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizResultRepository extends JpaRepository<QuizResult, Long> {
    List<QuizResult> findByUserId(Long userId);
    List<QuizResult> findByQuizId(Long quizId);
    Optional<QuizResult> findTopByQuizIdAndUserIdOrderByCreatedAtDesc(Long quizId, Long userId);
    
    @Modifying
    @Query("DELETE FROM QuizResult qr WHERE qr.quizId = :quizId")
    void deleteByQuizId(@Param("quizId") Long quizId);
    
    // Get all results for a user in a specific course (via quiz -> lesson -> course)
    @Query("SELECT qr FROM QuizResult qr " +
           "JOIN qr.quiz q " +
           "JOIN Lesson l ON q.lessonId = l.id " +
           "WHERE qr.userId = :userId AND l.courseId = :courseId " +
           "ORDER BY qr.createdAt DESC")
    List<QuizResult> findByUserIdAndCourseId(@Param("userId") Long userId, @Param("courseId") Long courseId);
    
    // Get all results for quizzes in a course
    @Query("SELECT qr FROM QuizResult qr " +
           "JOIN qr.quiz q " +
           "JOIN Lesson l ON q.lessonId = l.id " +
           "WHERE l.courseId = :courseId " +
           "ORDER BY qr.createdAt DESC")
    List<QuizResult> findByCourseId(@Param("courseId") Long courseId);
    
    // Count attempts by user and quiz
    @Query("SELECT COUNT(qr) FROM QuizResult qr WHERE qr.userId = :userId AND qr.quizId = :quizId")
    Integer countByUserIdAndQuizId(@Param("userId") Long userId, @Param("quizId") Long quizId);
    
    // Get average score for a quiz
    @Query("SELECT AVG(qr.score) FROM QuizResult qr WHERE qr.quizId = :quizId")
    Double getAverageScoreByQuizId(@Param("quizId") Long quizId);
    
    // Count unique students who took a quiz
    @Query("SELECT COUNT(DISTINCT qr.userId) FROM QuizResult qr WHERE qr.quizId = :quizId")
    Integer countUniqueStudentsByQuizId(@Param("quizId") Long quizId);
}
