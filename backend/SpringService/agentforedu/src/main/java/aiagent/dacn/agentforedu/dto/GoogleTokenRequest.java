package aiagent.dacn.agentforedu.dto;

import lombok.Data;

@Data
public class GoogleTokenRequest {
    private String accessToken;
    private String refreshToken;
    private String expiryTime;  // ISO format
    private Boolean connected;
    private String email;
}
