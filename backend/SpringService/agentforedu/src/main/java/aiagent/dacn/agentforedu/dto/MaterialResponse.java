package aiagent.dacn.agentforedu.dto;

import aiagent.dacn.agentforedu.entity.MaterialType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaterialResponse {
    private Long id;
    private Long courseId;
    private String title;
    private String description;
    private String fileUrl;
    private MaterialType type;
    private Long uploadedBy;
    private String uploaderName;
    private LocalDateTime uploadedAt;
}
