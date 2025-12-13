package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.GoogleTokenRequest;
import aiagent.dacn.agentforedu.dto.GoogleTokenResponse;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class GoogleOAuthService {
    
    private final UserRepository userRepository;
    
    @Transactional
    public void saveTokens(Long userId, GoogleTokenRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setGoogleAccessToken(request.getAccessToken());
        user.setGoogleRefreshToken(request.getRefreshToken());
        
        if (request.getExpiryTime() != null) {
            LocalDateTime expiry = LocalDateTime.parse(
                request.getExpiryTime(), 
                DateTimeFormatter.ISO_DATE_TIME
            );
            user.setGoogleTokenExpiry(expiry);
        }
        
        user.setGoogleConnected(request.getConnected() != null ? request.getConnected() : true);
        user.setGoogleEmail(request.getEmail());
        
        userRepository.save(user);
    }
    
    public GoogleTokenResponse getTokens(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!Boolean.TRUE.equals(user.getGoogleConnected())) {
            return GoogleTokenResponse.builder()
                    .connected(false)
                    .build();
        }
        
        boolean expired = user.getGoogleTokenExpiry() != null 
                && user.getGoogleTokenExpiry().isBefore(LocalDateTime.now());
        
        return GoogleTokenResponse.builder()
                .accessToken(user.getGoogleAccessToken())
                .refreshToken(user.getGoogleRefreshToken())
                .expiryTime(user.getGoogleTokenExpiry() != null 
                        ? user.getGoogleTokenExpiry().format(DateTimeFormatter.ISO_DATE_TIME) 
                        : null)
                .connected(true)
                .email(user.getGoogleEmail())
                .expired(expired)
                .build();
    }
    
    @Transactional
    public void deleteTokens(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setGoogleAccessToken(null);
        user.setGoogleRefreshToken(null);
        user.setGoogleTokenExpiry(null);
        user.setGoogleConnected(false);
        user.setGoogleEmail(null);
        
        userRepository.save(user);
    }
    
    public GoogleTokenResponse getConnectionStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (!Boolean.TRUE.equals(user.getGoogleConnected())) {
            return GoogleTokenResponse.builder()
                    .connected(false)
                    .build();
        }
        
        boolean expired = user.getGoogleTokenExpiry() != null 
                && user.getGoogleTokenExpiry().isBefore(LocalDateTime.now());
        
        return GoogleTokenResponse.builder()
                .connected(true)
                .email(user.getGoogleEmail())
                .expiryTime(user.getGoogleTokenExpiry() != null 
                        ? user.getGoogleTokenExpiry().format(DateTimeFormatter.ISO_DATE_TIME) 
                        : null)
                .expired(expired)
                .build();
    }
}
