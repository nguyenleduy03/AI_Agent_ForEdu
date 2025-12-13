package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.ScheduleRequest;
import aiagent.dacn.agentforedu.dto.ScheduleResponse;
import aiagent.dacn.agentforedu.entity.UserSchedule;
import aiagent.dacn.agentforedu.repository.UserScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScheduleService {
    
    private final UserScheduleRepository scheduleRepository;
    
    public List<ScheduleResponse> getTodaySchedule(Long userId) {
        String today = LocalDate.now().getDayOfWeek().name();
        List<UserSchedule> schedules = scheduleRepository.findByUserIdAndDayOfWeek(userId, today);
        return schedules.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    public List<ScheduleResponse> getScheduleByDay(Long userId, String dayOfWeek) {
        List<UserSchedule> schedules = scheduleRepository.findByUserIdAndDayOfWeek(userId, dayOfWeek.toUpperCase());
        return schedules.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    public List<ScheduleResponse> getAllSchedules(Long userId) {
        List<UserSchedule> schedules = scheduleRepository.findByUserIdOrderByDayOfWeekAscStartTimeAsc(userId);
        return schedules.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional
    public ScheduleResponse createSchedule(Long userId, ScheduleRequest request) {
        UserSchedule schedule = new UserSchedule();
        schedule.setUserId(userId);
        schedule.setDayOfWeek(request.getDayOfWeek().toUpperCase());
        schedule.setStartTime(LocalTime.parse(request.getStartTime()));
        schedule.setEndTime(LocalTime.parse(request.getEndTime()));
        schedule.setSubject(request.getSubject());
        schedule.setRoom(request.getRoom());
        schedule.setTeacher(request.getTeacher());
        schedule.setNotes(request.getNotes());
        
        schedule = scheduleRepository.save(schedule);
        return toResponse(schedule);
    }
    
    @Transactional
    public void deleteAllSchedules(Long userId) {
        scheduleRepository.deleteByUserId(userId);
    }
    
    private ScheduleResponse toResponse(UserSchedule schedule) {
        ScheduleResponse response = new ScheduleResponse();
        response.setId(schedule.getId());
        response.setDayOfWeek(schedule.getDayOfWeek());
        response.setStartTime(schedule.getStartTime());
        response.setEndTime(schedule.getEndTime());
        response.setSubject(schedule.getSubject());
        response.setRoom(schedule.getRoom());
        response.setTeacher(schedule.getTeacher());
        response.setNotes(schedule.getNotes());
        return response;
    }
}
