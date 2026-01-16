package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.ChangePasswordRequest;
import aiagent.dacn.agentforedu.dto.UpdateProfileRequest;
import aiagent.dacn.agentforedu.dto.UserResponse;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    @Transactional(readOnly = true)
    public UserResponse getProfile(User user) {
        return toResponse(user);
    }
    
    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request, User user) {
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getEmail() != null) {
            if (userRepository.existsByEmail(request.getEmail()) && 
                !request.getEmail().equals(user.getEmail())) {
                throw new RuntimeException("Email đã được sử dụng");
            }
            user.setEmail(request.getEmail());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        
        User updated = userRepository.save(user);
        return toResponse(updated);
    }
    
    @Transactional
    public UserResponse updateAvatar(User user, String avatarUrl, String avatarDriveId) {
        user.setAvatarUrl(avatarUrl);
        user.setAvatarDriveId(avatarDriveId);
        User updated = userRepository.save(user);
        return toResponse(updated);
    }
    
    @Transactional
    public void changePassword(ChangePasswordRequest request, User user) {
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu cũ không đúng");
        }
        
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
    
    // Admin methods
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return toResponse(user);
    }
    
    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy người dùng");
        }
        userRepository.deleteById(id);
    }
    
    @Transactional
    public UserResponse updateUserRole(Long id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        try {
            user.setRole(aiagent.dacn.agentforedu.entity.Role.valueOf(role.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Role không hợp lệ: " + role);
        }
        User updated = userRepository.save(user);
        return toResponse(updated);
    }
    
    private UserResponse toResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setRole(user.getRole());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        return response;
    }
}
