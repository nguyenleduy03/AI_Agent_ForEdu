package aiagent.dacn.agentforedu.dto;

import aiagent.dacn.agentforedu.entity.QuizDifficulty;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UpdateQuizRequest {
    
    private String title;
    
    private String description;
    
    private QuizDifficulty difficulty;
    
    private LocalDateTime deadline; // Hạn làm bài - null = không giới hạn
    
    private Integer timeLimitMinutes; // Thời gian làm bài (phút) - null = không giới hạn
    
    private Integer maxAttempts; // Số lần làm bài tối đa - null = không giới hạn
    
    private Boolean shuffleQuestions; // Xáo trộn thứ tự câu hỏi
    
    private Boolean shuffleOptions; // Xáo trộn thứ tự đáp án
    
    private Boolean isPublic; // Quiz công khai hay riêng tư
}
