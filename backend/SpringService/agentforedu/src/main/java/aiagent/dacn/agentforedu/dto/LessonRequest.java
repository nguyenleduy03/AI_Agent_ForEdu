package aiagent.dacn.agentforedu.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LessonRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;
    
    private String content;
    private Integer orderIndex;
}
