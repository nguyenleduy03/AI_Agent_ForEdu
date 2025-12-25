package aiagent.dacn.agentforedu.repository;

import aiagent.dacn.agentforedu.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {
    List<QuizQuestion> findByQuizId(Long quizId);
    int countByQuizId(Long quizId);
    
    @Modifying
    @Query("DELETE FROM QuizQuestion qq WHERE qq.quizId = :quizId")
    void deleteByQuizId(@Param("quizId") Long quizId);
}
