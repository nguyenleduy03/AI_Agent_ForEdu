package aiagent.dacn.agentforedu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "quizzes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Quiz {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "course_id")
    private Long courseId;
    
    @Column(name = "lesson_id")
    private Long lessonId;
    
    @Column(length = 255)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "created_by", nullable = false)
    private Long createdBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", insertable = false, updatable = false)
    private User creator;
    
    @Enumerated(EnumType.STRING)
    private QuizDifficulty difficulty;
    
    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = false; // true = công khai cho sinh viên, false = riêng tư
    
    @Column(name = "deadline")
    private LocalDateTime deadline; // Hạn làm bài - null = không giới hạn
    
    @Column(name = "time_limit_minutes")
    private Integer timeLimitMinutes; // Thời gian làm bài (phút) - null = không giới hạn
    
    @Column(name = "max_attempts")
    private Integer maxAttempts; // Số lần làm bài tối đa - null = không giới hạn
    
    @Column(name = "shuffle_questions")
    private Boolean shuffleQuestions = false; // Xáo trộn thứ tự câu hỏi
    
    @Column(name = "shuffle_options")
    private Boolean shuffleOptions = false; // Xáo trộn thứ tự đáp án
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    /**
     * Kiểm tra quiz đã hết hạn chưa
     */
    public boolean isExpired() {
        if (deadline == null) {
            return false; // Không có deadline = không hết hạn
        }
        return LocalDateTime.now().isAfter(deadline);
    }
}
