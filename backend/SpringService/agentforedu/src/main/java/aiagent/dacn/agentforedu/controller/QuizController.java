package aiagent.dacn.agentforedu.controller;

import aiagent.dacn.agentforedu.dto.*;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.service.QuizService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
@Tag(name = "Quiz Generation", description = "API tạo và làm bài quiz (AI)")
@SecurityRequirement(name = "bearerAuth")
public class QuizController {
    
    private final QuizService quizService;
    
    @PostMapping("/generate")
    @Operation(summary = "Tạo quiz tự động từ bài học (AI)")
    public ResponseEntity<QuizResponse> generateQuiz(
            @Valid @RequestBody GenerateQuizRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(quizService.generateQuiz(request, user));
    }
    
    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin quiz và câu hỏi")
    public ResponseEntity<QuizResponse> getQuiz(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuiz(id));
    }
    
    @PostMapping("/{id}/submit")
    @Operation(summary = "Nộp bài quiz và nhận kết quả")
    public ResponseEntity<QuizResultResponse> submitQuiz(
            @PathVariable Long id,
            @Valid @RequestBody SubmitQuizRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(quizService.submitQuiz(id, request, user));
    }
}
