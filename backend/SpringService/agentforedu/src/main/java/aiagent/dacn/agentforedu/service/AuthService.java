package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.AuthResponse;
import aiagent.dacn.agentforedu.dto.LoginRequest;
import aiagent.dacn.agentforedu.dto.RegisterRequest;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.repository.UserRepository;
import aiagent.dacn.agentforedu.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username đã tồn tại");
        }
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã tồn tại");
        }
        
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        
        // Set role from request or default to STUDENT
        if (request.getRole() != null && !request.getRole().isEmpty()) {
            try {
                user.setRole(aiagent.dacn.agentforedu.entity.Role.valueOf(request.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                user.setRole(aiagent.dacn.agentforedu.entity.Role.STUDENT);
            }
        } else {
            user.setRole(aiagent.dacn.agentforedu.entity.Role.STUDENT);
        }
        
        userRepository.save(user);
        
        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, user);
    }
    
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );
        
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, user);
    }
}
