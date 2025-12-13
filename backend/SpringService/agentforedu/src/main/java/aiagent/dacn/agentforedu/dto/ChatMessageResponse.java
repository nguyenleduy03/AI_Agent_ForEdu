package aiagent.dacn.agentforedu.dto;

import aiagent.dacn.agentforedu.entity.MessageSender;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageResponse {
    private Long id;
    private Long sessionId;
    private MessageSender sender;
    private String message;
    private LocalDateTime timestamp;
}
