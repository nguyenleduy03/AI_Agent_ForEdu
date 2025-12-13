package aiagent.dacn.agentforedu.dto;

import aiagent.dacn.agentforedu.entity.MaterialType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MaterialRequest {
    @NotNull(message = "Course ID không được để trống")
    private Long courseId;
    
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;
    
    private String description;
    
    @NotBlank(message = "File URL không được để trống")
    private String fileUrl;
    
    @NotNull(message = "Loại tài liệu không được để trống")
    private MaterialType type;
}
