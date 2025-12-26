package aiagent.dacn.agentforedu.dto;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;
    
    @Email(message = "Email không hợp lệ")
    private String email;  // Can be null - validation only applies if not null
    
    private String avatarUrl;
}
