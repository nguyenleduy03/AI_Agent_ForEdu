package aiagent.dacn.agentforedu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "quiz_questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuizQuestion {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "quiz_id", nullable = false)
    private Long quizId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", insertable = false, updatable = false)
    private Quiz quiz;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String question;
    
    @Column(name = "option_a", columnDefinition = "TEXT")
    private String optionA;
    
    @Column(name = "option_b", columnDefinition = "TEXT")
    private String optionB;
    
    @Column(name = "option_c", columnDefinition = "TEXT")
    private String optionC;
    
    @Column(name = "option_d", columnDefinition = "TEXT")
    private String optionD;
    
    @Column(name = "correct_answer", length = 1)
    private String correctAnswer; // 'A', 'B', 'C', 'D'
}
