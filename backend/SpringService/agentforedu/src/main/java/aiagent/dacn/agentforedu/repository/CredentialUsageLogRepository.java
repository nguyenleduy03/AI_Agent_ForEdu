package aiagent.dacn.agentforedu.repository;

import aiagent.dacn.agentforedu.entity.CredentialUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CredentialUsageLogRepository extends JpaRepository<CredentialUsageLog, Long> {

    List<CredentialUsageLog> findByCredentialIdOrderByCreatedAtDesc(Long credentialId);

    List<CredentialUsageLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<CredentialUsageLog> findByCredentialIdAndCreatedAtAfter(Long credentialId, LocalDateTime after);

    long countByCredentialIdAndSuccess(Long credentialId, Boolean success);
}
