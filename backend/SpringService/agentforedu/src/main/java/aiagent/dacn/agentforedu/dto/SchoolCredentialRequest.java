package aiagent.dacn.agentforedu.dto;

import lombok.Data;

@Data
public class SchoolCredentialRequest {
    private String username;
    private String password;
    private String schoolUrl;
}
