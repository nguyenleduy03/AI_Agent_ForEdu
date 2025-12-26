package aiagent.dacn.agentforedu.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "materials")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Material {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "course_id", nullable = false)
    private Long courseId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", insertable = false, updatable = false)
    private Course course;
    
    // Liên kết với Lesson (optional)
    @Column(name = "lesson_id")
    private Long lessonId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", insertable = false, updatable = false)
    private Lesson lesson;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "file_url", length = 1000)
    private String fileUrl;
    
    @Enumerated(EnumType.STRING)
    private MaterialType type;
    
    // Google Drive fields
    @Column(name = "drive_file_id")
    private String driveFileId;
    
    @Column(name = "drive_embed_link", length = 500)
    private String driveEmbedLink;
    
    @Column(name = "drive_download_link", length = 500)
    private String driveDownloadLink;
    
    // File size in bytes
    @Column(name = "file_size")
    private Long fileSize;
    
    // Original filename
    @Column(name = "original_filename")
    private String originalFilename;
    
    @Column(name = "uploaded_by", nullable = false)
    private Long uploadedBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", insertable = false, updatable = false)
    private User uploader;
    
    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;
}
