package aiagent.dacn.agentforedu.repository;

import aiagent.dacn.agentforedu.entity.ChatSession;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    List<ChatSession> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<ChatSession> findByUserIdOrderByUpdatedAtDesc(Long userId);
    List<ChatSession> findByUserIdOrderByUpdatedAtDesc(Long userId, Pageable pageable);
}
