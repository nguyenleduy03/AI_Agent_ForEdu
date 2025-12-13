package aiagent.dacn.agentforedu.dto;

import lombok.Data;

import java.util.Map;

@Data
public class SubmitQuizRequest {
    private Map<Long, String> answers; // questionId -> answer ('A', 'B', 'C', 'D')
}
