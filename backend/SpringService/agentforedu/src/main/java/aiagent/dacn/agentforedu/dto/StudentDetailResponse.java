package aiagent.dacn.agentforedu.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentDetailResponse {
    // Basic info
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String avatarUrl;
    private LocalDateTime enrolledAt;
    
    // Progress info
    private BigDecimal progressPercentage;
    private Integer completedLessons;
    private Integer totalLessons;
    private Integer totalTimeSpent; // seconds
    private LocalDateTime lastAccessedAt;
    
    // Quiz stats
    private Integer totalQuizzesTaken;
    private Integer totalQuizzesPassed; // score >= 50%
    private Double averageQuizScore;
    private Double highestQuizScore;
    private Double lowestQuizScore;
    
    // Quiz history
    private List<StudentQuizResultResponse> quizHistory;
    
    // Lesson progress details
    private List<LessonProgressResponse> lessonProgress;
}
