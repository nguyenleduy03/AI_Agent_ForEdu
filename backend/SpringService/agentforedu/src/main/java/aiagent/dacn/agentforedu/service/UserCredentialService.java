package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.entity.CredentialUsageLog;
import aiagent.dacn.agentforedu.entity.UserCredential;
import aiagent.dacn.agentforedu.repository.CredentialUsageLogRepository;
import aiagent.dacn.agentforedu.repository.UserCredentialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserCredentialService {

    private final UserCredentialRepository credentialRepository;
    private final CredentialUsageLogRepository usageLogRepository;
    private final CredentialEncryptionService encryptionService;

    @Transactional
    public UserCredential createCredential(Long userId, UserCredential credential) {
        credential.setUserId(userId);
        
        // Encrypt username and password
        if (credential.getUsername() != null) {
            credential.setEncryptedUsername(encryptionService.encrypt(credential.getUsername()));
        }
        if (credential.getPassword() != null) {
            credential.setEncryptedPassword(encryptionService.encrypt(credential.getPassword()));
        }
        
        credential.setIsActive(true);
        credential.setUsageCount(0);
        
        return credentialRepository.save(credential);
    }

    public List<UserCredential> getUserCredentials(Long userId) {
        return credentialRepository.findByUserId(userId);
    }

    public List<UserCredential> getActiveCredentials(Long userId) {
        return credentialRepository.findByUserIdAndIsActive(userId, true);
    }

    public List<UserCredential> getCredentialsByCategory(Long userId, UserCredential.CredentialCategory category) {
        return credentialRepository.findByUserIdAndCategory(userId, category);
    }

    public Optional<UserCredential> getCredentialById(Long userId, Long credentialId, boolean decrypt) {
        Optional<UserCredential> credentialOpt = credentialRepository.findById(credentialId);
        
        if (credentialOpt.isEmpty() || !credentialOpt.get().getUserId().equals(userId)) {
            return Optional.empty();
        }
        
        UserCredential credential = credentialOpt.get();
        
        if (decrypt) {
            credential.setUsername(encryptionService.decrypt(credential.getEncryptedUsername()));
            credential.setPassword(encryptionService.decrypt(credential.getEncryptedPassword()));
        } else {
            credential.setUsername(credential.getEncryptedUsername().substring(0, Math.min(10, credential.getEncryptedUsername().length())) + "...");
            credential.setPassword("****");
        }
        
        return Optional.of(credential);
    }

    @Transactional
    public Optional<UserCredential> updateCredential(Long userId, Long credentialId, UserCredential updates) {
        Optional<UserCredential> existingOpt = credentialRepository.findById(credentialId);
        
        if (existingOpt.isEmpty() || !existingOpt.get().getUserId().equals(userId)) {
            return Optional.empty();
        }
        
        UserCredential existing = existingOpt.get();
        
        // Update fields
        if (updates.getServiceName() != null) existing.setServiceName(updates.getServiceName());
        if (updates.getServiceUrl() != null) existing.setServiceUrl(updates.getServiceUrl());
        if (updates.getServiceType() != null) existing.setServiceType(updates.getServiceType());
        if (updates.getPurpose() != null) existing.setPurpose(updates.getPurpose());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getCategory() != null) existing.setCategory(updates.getCategory());
        if (updates.getTags() != null) existing.setTags(updates.getTags());
        if (updates.getLabel() != null) existing.setLabel(updates.getLabel());
        if (updates.getIsActive() != null) existing.setIsActive(updates.getIsActive());
        
        // Update credentials if provided
        if (updates.getUsername() != null) {
            existing.setEncryptedUsername(encryptionService.encrypt(updates.getUsername()));
        }
        if (updates.getPassword() != null) {
            existing.setEncryptedPassword(encryptionService.encrypt(updates.getPassword()));
        }
        
        return Optional.of(credentialRepository.save(existing));
    }

    @Transactional
    public boolean deleteCredential(Long userId, Long credentialId) {
        Optional<UserCredential> credentialOpt = credentialRepository.findById(credentialId);
        
        if (credentialOpt.isEmpty() || !credentialOpt.get().getUserId().equals(userId)) {
            return false;
        }
        
        credentialRepository.deleteById(credentialId);
        return true;
    }

    @Transactional
    public void logUsage(Long credentialId, Long userId, String action, String context, 
                         Boolean success, String errorMessage, String ipAddress, String userAgent) {
        CredentialUsageLog log = new CredentialUsageLog();
        log.setCredentialId(credentialId);
        log.setUserId(userId);
        log.setAction(action);
        log.setContext(context);
        log.setSuccess(success);
        log.setErrorMessage(errorMessage);
        log.setIpAddress(ipAddress);
        log.setUserAgent(userAgent);
        
        usageLogRepository.save(log);
        
        // Update credential usage stats
        credentialRepository.findById(credentialId).ifPresent(credential -> {
            credential.setLastUsedAt(LocalDateTime.now());
            credential.setUsageCount(credential.getUsageCount() + 1);
            credential.setLastSuccess(success);
            credentialRepository.save(credential);
        });
    }

    public List<UserCredential> searchCredentials(Long userId, String query) {
        return credentialRepository.searchByPurpose(userId, query);
    }

    public List<UserCredential> getInactiveCredentials(Long userId, int daysInactive) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysInactive);
        return credentialRepository.findInactiveCredentials(userId, cutoffDate);
    }

    public List<UserCredential> getMostUsedCredentials(Long userId) {
        return credentialRepository.findMostUsed(userId);
    }

    public List<CredentialUsageLog> getUsageLogs(Long credentialId) {
        return usageLogRepository.findByCredentialIdOrderByCreatedAtDesc(credentialId);
    }
}
