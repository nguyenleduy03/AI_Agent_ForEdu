package aiagent.dacn.agentforedu.dto;

import aiagent.dacn.agentforedu.entity.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserResponse user;
    
    public AuthResponse(String token, User user) {
        this.token = token;
        this.user = new UserResponse();
        this.user.setId(user.getId());
        this.user.setUsername(user.getUsername());
        this.user.setEmail(user.getEmail());
        this.user.setFullName(user.getFullName());
        this.user.setAvatarUrl(user.getAvatarUrl());
        this.user.setRole(user.getRole());
        this.user.setCreatedAt(user.getCreatedAt());
        this.user.setUpdatedAt(user.getUpdatedAt());
    }
}
