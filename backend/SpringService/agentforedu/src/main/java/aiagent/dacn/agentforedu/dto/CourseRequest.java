package aiagent.dacn.agentforedu.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CourseRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;
    
    private String description;
    
    private Boolean isPublic = true; // Default: public
    
    private String accessPassword; // Password for private courses (optional)
}
