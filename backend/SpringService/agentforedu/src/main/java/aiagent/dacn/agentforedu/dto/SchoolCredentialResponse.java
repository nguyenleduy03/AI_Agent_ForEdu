package aiagent.dacn.agentforedu.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SchoolCredentialResponse {
    private Long id;
    private String encryptedUsername;
    private String encryptedPassword;
    private String schoolUrl;
    private LocalDateTime lastSyncedAt;
    private Boolean isActive;
}
