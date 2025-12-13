package aiagent.dacn.agentforedu.dto;

import lombok.Data;

@Data
public class CredentialSearchRequest {
    private String query;
    private String context;
}
