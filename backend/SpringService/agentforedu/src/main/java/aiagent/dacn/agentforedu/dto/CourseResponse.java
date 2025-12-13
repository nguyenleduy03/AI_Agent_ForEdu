package aiagent.dacn.agentforedu.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private Long createdBy;
    private String creatorName;
    private Boolean isPublic;
    private Boolean isEnrolled; // Whether current user is enrolled
    private Long enrollmentCount; // Number of students enrolled
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
