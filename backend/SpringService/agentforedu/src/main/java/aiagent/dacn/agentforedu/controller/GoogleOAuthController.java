package aiagent.dacn.agentforedu.controller;

import aiagent.dacn.agentforedu.dto.GoogleTokenRequest;
import aiagent.dacn.agentforedu.dto.GoogleTokenResponse;
import aiagent.dacn.agentforedu.service.GoogleOAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Google OAuth", description = "Google OAuth token management")
public class GoogleOAuthController {
    
    private final GoogleOAuthService googleOAuthService;
    
    @PostMapping("/{userId}/google-tokens")
    @Operation(summary = "Save user's Google OAuth tokens")
    public ResponseEntity<Void> saveGoogleTokens(
            @PathVariable Long userId,
            @RequestBody GoogleTokenRequest request) {
        googleOAuthService.saveTokens(userId, request);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{userId}/google-tokens")
    @Operation(summary = "Get user's Google OAuth tokens")
    public ResponseEntity<GoogleTokenResponse> getGoogleTokens(@PathVariable Long userId) {
        GoogleTokenResponse response = googleOAuthService.getTokens(userId);
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{userId}/google-tokens")
    @Operation(summary = "Delete user's Google OAuth tokens")
    public ResponseEntity<Void> deleteGoogleTokens(@PathVariable Long userId) {
        googleOAuthService.deleteTokens(userId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/{userId}/google-status")
    @Operation(summary = "Check Google OAuth connection status")
    public ResponseEntity<GoogleTokenResponse> getConnectionStatus(@PathVariable Long userId) {
        GoogleTokenResponse response = googleOAuthService.getConnectionStatus(userId);
        return ResponseEntity.ok(response);
    }
}
