package aiagent.dacn.agentforedu.dto;

import lombok.Data;
import java.time.LocalTime;

@Data
public class ScheduleResponse {
    private Long id;
    private String dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private String subject;
    private String room;
    private String teacher;
    private String notes;
}
