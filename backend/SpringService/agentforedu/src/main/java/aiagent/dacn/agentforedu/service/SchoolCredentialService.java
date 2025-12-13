package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.SchoolCredentialRequest;
import aiagent.dacn.agentforedu.dto.SchoolCredentialResponse;
import aiagent.dacn.agentforedu.entity.UserSchoolCredential;
import aiagent.dacn.agentforedu.repository.UserSchoolCredentialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SchoolCredentialService {
    
    private final UserSchoolCredentialRepository credentialRepository;
    
    // Encryption key - In production, use environment variable
    private static final String ENCRYPTION_KEY = "AgentForEdu2024SecretKey1234567"; // 32 chars for AES-256
    
    @Transactional
    public SchoolCredentialResponse saveCredentials(Long userId, SchoolCredentialRequest request) {
        // Encrypt credentials
        String encryptedUsername = encrypt(request.getUsername());
        String encryptedPassword = encrypt(request.getPassword());
        
        // Check if credentials already exist
        Optional<UserSchoolCredential> existingOpt = credentialRepository.findByUserId(userId);
        
        UserSchoolCredential credential;
        if (existingOpt.isPresent()) {
            // Update existing
            credential = existingOpt.get();
            credential.setEncryptedUsername(encryptedUsername);
            credential.setEncryptedPassword(encryptedPassword);
            credential.setSchoolUrl(request.getSchoolUrl());
        } else {
            // Create new
            credential = new UserSchoolCredential();
            credential.setUserId(userId);
            credential.setEncryptedUsername(encryptedUsername);
            credential.setEncryptedPassword(encryptedPassword);
            credential.setSchoolUrl(request.getSchoolUrl());
            credential.setIsActive(true);
        }
        
        credential = credentialRepository.save(credential);
        
        return toResponse(credential);
    }
    
    public Optional<SchoolCredentialResponse> getCredentials(Long userId) {
        return credentialRepository.findByUserId(userId)
                .map(this::toResponse);
    }
    
    @Transactional
    public void updateLastSyncedAt(Long userId) {
        credentialRepository.findByUserId(userId).ifPresent(credential -> {
            credential.setLastSyncedAt(LocalDateTime.now());
            credentialRepository.save(credential);
        });
    }
    
    @Transactional
    public void deleteCredentials(Long userId) {
        credentialRepository.deleteByUserId(userId);
    }
    
    private SchoolCredentialResponse toResponse(UserSchoolCredential credential) {
        SchoolCredentialResponse response = new SchoolCredentialResponse();
        response.setId(credential.getId());
        response.setEncryptedUsername(credential.getEncryptedUsername());
        response.setEncryptedPassword(credential.getEncryptedPassword());
        response.setSchoolUrl(credential.getSchoolUrl());
        response.setLastSyncedAt(credential.getLastSyncedAt());
        response.setIsActive(credential.getIsActive());
        return response;
    }
    
    // Simple AES encryption
    private String encrypt(String plaintext) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(
                ENCRYPTION_KEY.getBytes(StandardCharsets.UTF_8), 
                "AES"
            );
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed", e);
        }
    }
    
    // Decrypt method (for testing only - Python will handle decryption)
    public String decrypt(String ciphertext) {
        try {
            SecretKeySpec secretKey = new SecretKeySpec(
                ENCRYPTION_KEY.getBytes(StandardCharsets.UTF_8), 
                "AES"
            );
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(ciphertext));
            return new String(decrypted, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed", e);
        }
    }
}
