package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.entity.SystemLog;
import aiagent.dacn.agentforedu.repository.SystemLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LogService {
    
    private final SystemLogRepository logRepository;
    
    @Transactional(readOnly = true)
    public List<SystemLog> getAllLogs() {
        return logRepository.findAllByOrderByTimestampDesc();
    }
    
    @Transactional(readOnly = true)
    public List<SystemLog> getUserLogs(Long userId) {
        return logRepository.findByUserIdOrderByTimestampDesc(userId);
    }
    
    @Transactional
    public void log(Long userId, String action, String detail) {
        SystemLog log = new SystemLog();
        log.setUserId(userId);
        log.setAction(action);
        log.setDetail(detail);
        logRepository.save(log);
    }
}
