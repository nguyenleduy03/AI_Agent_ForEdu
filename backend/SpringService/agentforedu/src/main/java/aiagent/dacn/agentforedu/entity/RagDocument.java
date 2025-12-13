package aiagent.dacn.agentforedu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "rag_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RagDocument {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "external_id")
    private String externalId; // ID trong knowledge_base.json
    
    @Column(name = "course_id")
    private Long courseId;
    
    @Column(name = "lesson_id")
    private Long lessonId;
    
    private String title;
    
    private String category;
    
    @Column(columnDefinition = "TEXT")
    private String tags; // Lưu dạng JSON string hoặc comma-separated
    
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
