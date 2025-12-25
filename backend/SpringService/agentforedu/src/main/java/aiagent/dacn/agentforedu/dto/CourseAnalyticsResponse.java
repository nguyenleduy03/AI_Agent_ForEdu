package aiagent.dacn.agentforedu.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseAnalyticsResponse {
    // Course info
    private Long courseId;
    private String courseTitle;
    private String courseDescription;
    private LocalDateTime createdAt;
    
    // Overview stats
    private Integer totalStudents;
    private Integer totalLessons;
    private Integer totalQuizzes;
    private Integer totalMaterials;
    
    // Progress stats
    private Double averageProgress; // % trung bình của tất cả SV
    private Integer studentsCompleted; // SV hoàn thành 100%
    private Integer studentsInProgress; // SV đang học (1-99%)
    private Integer studentsNotStarted; // SV chưa bắt đầu (0%)
    
    // Quiz stats
    private Integer totalQuizAttempts;
    private Double averageQuizScore;
    private Double passRate; // % SV đạt >= 50%
    
    // Time stats
    private Integer totalStudyTime; // Tổng thời gian học (seconds)
    private Double averageStudyTime; // Trung bình mỗi SV
    
    // Lesson analytics
    private List<LessonAnalytics> lessonAnalytics;
    
    // Quiz analytics
    private List<QuizAnalytics> quizAnalytics;
    
    // Top performers
    private List<StudentRankingResponse> topStudents;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LessonAnalytics {
        private Long lessonId;
        private String lessonTitle;
        private Integer orderIndex;
        private Integer studentsCompleted;
        private Integer studentsInProgress;
        private Double completionRate; // %
        private Integer totalTimeSpent;
        private Double averageTimeSpent;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuizAnalytics {
        private Long quizId;
        private String quizTitle;
        private Long lessonId;
        private String lessonTitle;
        private Integer totalAttempts;
        private Integer uniqueStudents;
        private Double averageScore;
        private Double highestScore;
        private Double lowestScore;
        private Double passRate;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentRankingResponse {
        private Long userId;
        private String username;
        private String fullName;
        private Double progressPercentage;
        private Double averageQuizScore;
        private Integer totalTimeSpent;
        private Integer rank;
    }
}
