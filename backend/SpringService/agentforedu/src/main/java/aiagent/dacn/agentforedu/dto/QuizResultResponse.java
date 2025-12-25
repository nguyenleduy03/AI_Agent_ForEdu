package aiagent.dacn.agentforedu.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizResultResponse {
    private Long quizId;
    private Integer totalQuestions;
    private Integer correctAnswers;
    private Double score; // Percentage
    private String message;
    private List<QuestionResult> questionResults;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionResult {
        private Long questionId;
        private String question;
        private String optionA;
        private String optionB;
        private String optionC;
        private String optionD;
        private String userAnswer;
        private String correctAnswer;
        private Boolean isCorrect;
        private String explanation;
    }
}
