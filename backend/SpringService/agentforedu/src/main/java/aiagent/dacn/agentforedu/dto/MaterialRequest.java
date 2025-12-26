package aiagent.dacn.agentforedu.dto;

import aiagent.dacn.agentforedu.entity.MaterialType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MaterialRequest {
    @NotNull(message = "Course ID không được để trống")
    private Long courseId;
    
    // Bắt buộc - phải liên kết với bài học cụ thể
    @NotNull(message = "Lesson ID không được để trống")
    private Long lessonId;
    
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;
    
    private String description;
    
    @NotBlank(message = "File URL không được để trống")
    private String fileUrl;
    
    // Accept string type và convert trong service
    @NotBlank(message = "Loại tài liệu không được để trống")
    private String type;
    
    // Google Drive fields
    private String driveFileId;
    private String driveEmbedLink;
    private String driveDownloadLink;
    
    // File info
    private Long fileSize;
    private String originalFilename;
    
    // Helper method to convert string to MaterialType
    public MaterialType getMaterialType() {
        try {
            return MaterialType.valueOf(this.type.toUpperCase());
        } catch (Exception e) {
            return MaterialType.OTHER;
        }
    }
}
