package aiagent.dacn.agentforedu.dto;

import aiagent.dacn.agentforedu.entity.UserCredential;
import lombok.Data;

import java.util.List;

@Data
public class CredentialRequest {
    private String serviceName;
    private String serviceUrl;
    private UserCredential.ServiceType serviceType;
    private String username;
    private String password;
    private String purpose;
    private String description;
    private UserCredential.CredentialCategory category;
    private List<String> tags;
    private String label;
}
