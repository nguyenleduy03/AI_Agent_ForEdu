package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.ChatMessageResponse;
import aiagent.dacn.agentforedu.dto.ChatSessionRequest;
import aiagent.dacn.agentforedu.dto.ChatSessionResponse;
import aiagent.dacn.agentforedu.entity.ChatMessage;
import aiagent.dacn.agentforedu.entity.ChatSession;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.repository.ChatMessageRepository;
import aiagent.dacn.agentforedu.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    
    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    
    @Transactional(readOnly = true)
    public List<ChatSessionResponse> getUserSessions(User user) {
        return sessionRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toSessionResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ChatSessionResponse createSession(ChatSessionRequest request, User user) {
        ChatSession session = new ChatSession();
        session.setUserId(user.getId());
        session.setTitle(request.getTitle() != null ? request.getTitle() : "New Chat");
        
        ChatSession saved = sessionRepository.save(session);
        return toSessionResponse(saved);
    }
    
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getSessionMessages(Long sessionId, User currentUser) {
        // Kiểm tra session có tồn tại không
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên chat"));
        
        // Kiểm tra session có thuộc về user hiện tại không
        if (!session.getUserId().equals(currentUser.getId())) {
            throw new RuntimeException("Bạn không có quyền truy cập phiên chat này");
        }
        
        return messageRepository.findBySessionIdOrderByTimestampAsc(sessionId).stream()
                .map(this::toMessageResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public ChatMessageResponse addMessage(Long sessionId, String sender, String messageText, User currentUser) {
        // Kiểm tra session có tồn tại không
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên chat"));
        
        // Kiểm tra session có thuộc về user hiện tại không
        if (!session.getUserId().equals(currentUser.getId())) {
            throw new RuntimeException("Bạn không có quyền gửi tin nhắn vào phiên chat này");
        }
        
        ChatMessage message = new ChatMessage();
        message.setSessionId(sessionId);
        message.setSender(aiagent.dacn.agentforedu.entity.MessageSender.valueOf(sender.toUpperCase()));
        message.setMessage(messageText);
        
        ChatMessage saved = messageRepository.save(message);
        return toMessageResponse(saved);
    }
    
    @Transactional
    public void deleteSession(Long sessionId, User currentUser) {
        // Kiểm tra session có tồn tại không
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên chat"));
        
        // Kiểm tra session có thuộc về user hiện tại không
        if (!session.getUserId().equals(currentUser.getId())) {
            throw new RuntimeException("Bạn không có quyền xóa phiên chat này");
        }
        
        sessionRepository.deleteById(sessionId);
    }
    
    private ChatSessionResponse toSessionResponse(ChatSession session) {
        ChatSessionResponse response = new ChatSessionResponse();
        response.setId(session.getId());
        response.setUserId(session.getUserId());
        response.setTitle(session.getTitle());
        response.setCreatedAt(session.getCreatedAt());
        return response;
    }
    
    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        ChatMessageResponse response = new ChatMessageResponse();
        response.setId(message.getId());
        response.setSessionId(message.getSessionId());
        response.setSender(message.getSender());
        response.setMessage(message.getMessage());
        response.setTimestamp(message.getTimestamp());
        return response;
    }
    
    // ===== INTERNAL API FOR PYTHON SERVICE =====
    
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getSessionMessagesInternal(Long sessionId) {
        // Internal API - no authentication check
        // Used by Python service for conversation context
        return messageRepository.findBySessionIdOrderByTimestampAsc(sessionId).stream()
                .map(this::toMessageResponse)
                .collect(Collectors.toList());
    }
}
