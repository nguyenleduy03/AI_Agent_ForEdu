package aiagent.dacn.agentforedu.dto;

import aiagent.dacn.agentforedu.entity.UserCredential;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CredentialResponse {
    private Long id;
    private String serviceName;
    private String serviceUrl;
    private UserCredential.ServiceType serviceType;
    private String username; // Masked or decrypted based on request
    private String password; // Masked or decrypted based on request
    private String purpose;
    private String description;
    private UserCredential.CredentialCategory category;
    private List<String> tags;
    private String label;
    private Boolean isActive;
    private Boolean isShared;
    private LocalDateTime lastUsedAt;
    private Integer usageCount;
    private Boolean lastSuccess;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CredentialResponse fromEntity(UserCredential credential, boolean includePassword) {
        CredentialResponse response = new CredentialResponse();
        response.setId(credential.getId());
        response.setServiceName(credential.getServiceName());
        response.setServiceUrl(credential.getServiceUrl());
        response.setServiceType(credential.getServiceType());
        response.setPurpose(credential.getPurpose());
        response.setDescription(credential.getDescription());
        response.setCategory(credential.getCategory());
        response.setTags(credential.getTagsList());
        response.setLabel(credential.getLabel());
        response.setIsActive(credential.getIsActive());
        response.setIsShared(credential.getIsShared());
        response.setLastUsedAt(credential.getLastUsedAt());
        response.setUsageCount(credential.getUsageCount());
        response.setLastSuccess(credential.getLastSuccess());
        response.setCreatedAt(credential.getCreatedAt());
        response.setUpdatedAt(credential.getUpdatedAt());
        
        // Set username and password (masked or decrypted)
        response.setUsername(credential.getUsername());
        response.setPassword(includePassword ? credential.getPassword() : "****");
        
        return response;
    }
}
