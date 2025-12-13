package aiagent.dacn.agentforedu.dto;

import lombok.Data;

@Data
public class ScheduleRequest {
    private String dayOfWeek;
    private String startTime;  // HH:MM format
    private String endTime;    // HH:MM format
    private String subject;
    private String room;
    private String teacher;
    private String notes;
}
