package aiagent.dacn.agentforedu.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoogleTokenResponse {
    private String accessToken;
    private String refreshToken;
    private String expiryTime;
    private Boolean connected;
    private String email;
    private Boolean expired;
}
