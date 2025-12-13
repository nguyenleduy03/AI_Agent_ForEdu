package aiagent.dacn.agentforedu.repository;

import aiagent.dacn.agentforedu.entity.UserSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserScheduleRepository extends JpaRepository<UserSchedule, Long> {
    
    List<UserSchedule> findByUserIdAndDayOfWeek(Long userId, String dayOfWeek);
    
    List<UserSchedule> findByUserIdOrderByDayOfWeekAscStartTimeAsc(Long userId);
    
    void deleteByUserId(Long userId);
}
