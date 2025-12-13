package aiagent.dacn.agentforedu.repository;

import aiagent.dacn.agentforedu.entity.SystemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, Long> {
    List<SystemLog> findByUserIdOrderByTimestampDesc(Long userId);
    List<SystemLog> findAllByOrderByTimestampDesc();
}
