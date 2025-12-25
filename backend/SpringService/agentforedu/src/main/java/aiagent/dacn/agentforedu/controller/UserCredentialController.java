package aiagent.dacn.agentforedu.controller;

import aiagent.dacn.agentforedu.dto.*;
import aiagent.dacn.agentforedu.entity.CredentialUsageLog;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.entity.UserCredential;
import aiagent.dacn.agentforedu.service.UserCredentialService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/credentials")
@RequiredArgsConstructor
@Tag(name = "User Credentials", description = "Universal Credential Manager APIs")
@SecurityRequirement(name = "bearerAuth")
public class UserCredentialController {

    private final UserCredentialService credentialService;

    // ========== PUBLIC ENDPOINT (không cần auth) ==========
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get credentials by user ID", description = "Get all credentials for a specific user (internal use)")
    public ResponseEntity<?> getCredentialsByUserId(@PathVariable Long userId) {
        List<UserCredential> credentials = credentialService.getUserCredentials(userId);
        
        List<CredentialResponse> responses = credentials.stream()
                .map(c -> CredentialResponse.fromEntity(c, true)) // Include decrypted for internal use
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}/decrypt")
    @Operation(summary = "Get decrypted credential", description = "Get credential with decrypted password (internal use)")
    public ResponseEntity<?> getDecryptedCredential(@PathVariable Long id) {
        return credentialService.getCredentialByIdOnly(id, true)
                .map(c -> ResponseEntity.ok(CredentialResponse.fromEntity(c, true)))
                .orElse(ResponseEntity.notFound().build());
    }
    // ========== END PUBLIC ENDPOINTS ==========

    @PostMapping
    @Operation(summary = "Create new credential", description = "Create a new credential for any service")
    public ResponseEntity<?> createCredential(
            @AuthenticationPrincipal User user,
            @RequestBody CredentialRequest request) {
        
        UserCredential credential = new UserCredential();
        credential.setServiceName(request.getServiceName());
        credential.setServiceUrl(request.getServiceUrl());
        credential.setServiceType(request.getServiceType());
        credential.setUsername(request.getUsername());
        credential.setPassword(request.getPassword());
        credential.setPurpose(request.getPurpose());
        credential.setDescription(request.getDescription());
        credential.setCategory(request.getCategory());
        credential.setLabel(request.getLabel());
        
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            credential.setTags(convertTagsToJson(request.getTags()));
        }
        
        UserCredential created = credentialService.createCredential(user.getId(), credential);
        
        // Auto-sync to vector DB for semantic search
        syncToVectorDB(created, user.getId());
        
        return ResponseEntity.ok(CredentialResponse.fromEntity(created, false));
    }
    
    private void syncToVectorDB(UserCredential credential, Long userId) {
        try {
            // Call Python service to add to vector DB
            RestTemplate restTemplate = new RestTemplate();
            String pythonServiceUrl = "http://localhost:8000/api/credentials/vector/add";
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("credential_id", credential.getId());
            payload.put("user_id", userId);
            payload.put("service_name", credential.getServiceName());
            payload.put("purpose", credential.getPurpose());
            payload.put("description", credential.getDescription());
            payload.put("category", credential.getCategory().toString());
            payload.put("tags", credential.getTagsList());
            
            restTemplate.postForEntity(pythonServiceUrl, payload, String.class);
        } catch (Exception e) {
            // Log but don't fail the request
            System.err.println("Failed to sync to vector DB: " + e.getMessage());
        }
    }

    @GetMapping
    @Operation(summary = "Get all credentials", description = "Get all credentials for current user")
    public ResponseEntity<?> getAllCredentials(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String category,
            @RequestParam(required = false, defaultValue = "true") Boolean active) {
        
        List<UserCredential> credentials;
        
        if (category != null) {
            UserCredential.CredentialCategory cat = UserCredential.CredentialCategory.valueOf(category.toUpperCase());
            credentials = credentialService.getCredentialsByCategory(user.getId(), cat);
        } else if (active) {
            credentials = credentialService.getActiveCredentials(user.getId());
        } else {
            credentials = credentialService.getUserCredentials(user.getId());
        }
        
        List<CredentialResponse> responses = credentials.stream()
                .map(c -> {
                    c.setUsername(c.getEncryptedUsername().substring(0, Math.min(10, c.getEncryptedUsername().length())) + "...");
                    c.setPassword("****");
                    return CredentialResponse.fromEntity(c, false);
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get credential by ID", description = "Get credential details, optionally decrypt password")
    public ResponseEntity<?> getCredentialById(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") Boolean decrypt) {
        
        return credentialService.getCredentialById(user.getId(), id, decrypt)
                .map(c -> ResponseEntity.ok(CredentialResponse.fromEntity(c, decrypt)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update credential", description = "Update credential information")
    public ResponseEntity<?> updateCredential(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody CredentialRequest request) {
        
        UserCredential updates = new UserCredential();
        updates.setServiceName(request.getServiceName());
        updates.setServiceUrl(request.getServiceUrl());
        updates.setServiceType(request.getServiceType());
        updates.setUsername(request.getUsername());
        updates.setPassword(request.getPassword());
        updates.setPurpose(request.getPurpose());
        updates.setDescription(request.getDescription());
        updates.setCategory(request.getCategory());
        updates.setLabel(request.getLabel());
        
        if (request.getTags() != null) {
            updates.setTags(convertTagsToJson(request.getTags()));
        }
        
        return credentialService.updateCredential(user.getId(), id, updates)
                .map(c -> ResponseEntity.ok(CredentialResponse.fromEntity(c, false)))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete credential", description = "Delete a credential")
    public ResponseEntity<?> deleteCredential(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        
        boolean deleted = credentialService.deleteCredential(user.getId(), id);
        return deleted ? ResponseEntity.ok().build() : ResponseEntity.notFound().build();
    }

    @PostMapping("/search")
    @Operation(summary = "Search credentials (AI)", description = "Semantic search for credentials based on query")
    public ResponseEntity<?> searchCredentials(
            @AuthenticationPrincipal User user,
            @RequestBody CredentialSearchRequest request) {
        
        List<UserCredential> credentials = credentialService.searchCredentials(user.getId(), request.getQuery());
        
        List<CredentialResponse> responses = credentials.stream()
                .map(c -> {
                    c.setUsername(c.getEncryptedUsername().substring(0, Math.min(10, c.getEncryptedUsername().length())) + "...");
                    c.setPassword("****");
                    return CredentialResponse.fromEntity(c, false);
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    @PostMapping("/{id}/use")
    @Operation(summary = "Log credential usage", description = "Log when a credential is used")
    public ResponseEntity<?> logUsage(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody CredentialUsageRequest request,
            HttpServletRequest httpRequest) {
        
        String ipAddress = httpRequest.getRemoteAddr();
        String userAgent = httpRequest.getHeader("User-Agent");
        
        credentialService.logUsage(id, user.getId(), request.getAction(), request.getContext(),
                true, null, ipAddress, userAgent);
        
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/logs")
    @Operation(summary = "Get usage logs", description = "Get usage history for a credential")
    public ResponseEntity<?> getUsageLogs(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        
        List<CredentialUsageLog> logs = credentialService.getUsageLogs(id);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/inactive")
    @Operation(summary = "Get inactive credentials", description = "Get credentials not used in X days")
    public ResponseEntity<?> getInactiveCredentials(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "90") int days) {
        
        List<UserCredential> credentials = credentialService.getInactiveCredentials(user.getId(), days);
        
        List<CredentialResponse> responses = credentials.stream()
                .map(c -> {
                    c.setUsername("****");
                    c.setPassword("****");
                    return CredentialResponse.fromEntity(c, false);
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/most-used")
    @Operation(summary = "Get most used credentials", description = "Get credentials sorted by usage count")
    public ResponseEntity<?> getMostUsedCredentials(@AuthenticationPrincipal User user) {
        List<UserCredential> credentials = credentialService.getMostUsedCredentials(user.getId());
        
        List<CredentialResponse> responses = credentials.stream()
                .limit(10)
                .map(c -> {
                    c.setUsername("****");
                    c.setPassword("****");
                    return CredentialResponse.fromEntity(c, false);
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(responses);
    }

    private String convertTagsToJson(List<String> tags) {
        return "[\"" + String.join("\",\"", tags) + "\"]";
    }
}
