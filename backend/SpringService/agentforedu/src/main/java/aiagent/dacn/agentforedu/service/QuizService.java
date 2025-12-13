package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.*;
import aiagent.dacn.agentforedu.entity.*;
import aiagent.dacn.agentforedu.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {
    
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizResultRepository resultRepository;
    private final LessonRepository lessonRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String FASTAPI_URL = "http://localhost:8000";
    
    @Transactional
    public QuizResponse generateQuiz(GenerateQuizRequest request, User user) {
        // 1. Lấy nội dung bài học
        Lesson lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài học"));
        
        // 2. Gọi FastAPI để sinh câu hỏi
        Map<String, Object> aiRequest = new HashMap<>();
        aiRequest.put("content", lesson.getContent());
        aiRequest.put("num_questions", request.getNumQuestions());
        aiRequest.put("difficulty", request.getDifficulty().name().toLowerCase());
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(aiRequest, headers);
        
        Map<String, Object> aiResponse;
        try {
            aiResponse = restTemplate.postForObject(
                FASTAPI_URL + "/api/ai/generate-quiz", 
                entity, 
                Map.class
            );
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi gọi AI service: " + e.getMessage());
        }
        
        // 3. Lưu quiz vào database
        Quiz quiz = new Quiz();
        quiz.setCourseId(lesson.getCourseId());
        quiz.setLessonId(lesson.getId());
        quiz.setCreatedBy(user.getId());
        quiz.setDifficulty(request.getDifficulty());
        
        Quiz savedQuiz = quizRepository.save(quiz);
        
        // 4. Lưu các câu hỏi
        List<Map<String, String>> questions = (List<Map<String, String>>) aiResponse.get("questions");
        List<QuizQuestion> quizQuestions = new ArrayList<>();
        
        for (Map<String, String> q : questions) {
            QuizQuestion question = new QuizQuestion();
            question.setQuizId(savedQuiz.getId());
            question.setQuestion(q.get("question"));
            question.setOptionA(q.get("a"));
            question.setOptionB(q.get("b"));
            question.setOptionC(q.get("c"));
            question.setOptionD(q.get("d"));
            question.setCorrectAnswer(q.get("correct").toUpperCase());
            
            quizQuestions.add(questionRepository.save(question));
        }
        
        return toQuizResponse(savedQuiz, quizQuestions);
    }
    
    @Transactional(readOnly = true)
    public QuizResponse getQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quiz"));
        
        List<QuizQuestion> questions = questionRepository.findByQuizId(quizId);
        return toQuizResponse(quiz, questions);
    }
    
    @Transactional
    public QuizResultResponse submitQuiz(Long quizId, SubmitQuizRequest request, User user) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quiz"));
        
        List<QuizQuestion> questions = questionRepository.findByQuizId(quizId);
        
        int correctCount = 0;
        for (QuizQuestion q : questions) {
            String userAnswer = request.getAnswers().get(q.getId());
            if (userAnswer != null && userAnswer.equalsIgnoreCase(q.getCorrectAnswer())) {
                correctCount++;
            }
        }
        
        double score = (double) correctCount / questions.size() * 100;
        
        // Lưu kết quả
        QuizResult result = new QuizResult();
        result.setQuizId(quizId);
        result.setUserId(user.getId());
        result.setScore(score);
        resultRepository.save(result);
        
        QuizResultResponse response = new QuizResultResponse();
        response.setQuizId(quizId);
        response.setTotalQuestions(questions.size());
        response.setCorrectAnswers(correctCount);
        response.setScore(score);
        response.setMessage(getScoreMessage(score));
        
        return response;
    }
    
    private String getScoreMessage(double score) {
        if (score >= 90) return "Xuất sắc! 🎉";
        if (score >= 70) return "Tốt lắm! 👍";
        if (score >= 50) return "Khá! Cố gắng thêm nhé! 💪";
        return "Cần ôn tập thêm! 📚";
    }
    
    private QuizResponse toQuizResponse(Quiz quiz, List<QuizQuestion> questions) {
        QuizResponse response = new QuizResponse();
        response.setId(quiz.getId());
        response.setCourseId(quiz.getCourseId());
        response.setLessonId(quiz.getLessonId());
        response.setDifficulty(quiz.getDifficulty());
        response.setCreatedBy(quiz.getCreatedBy());
        response.setCreatedAt(quiz.getCreatedAt());
        
        List<QuizQuestionResponse> questionResponses = questions.stream()
                .map(q -> {
                    QuizQuestionResponse qr = new QuizQuestionResponse();
                    qr.setId(q.getId());
                    qr.setQuestion(q.getQuestion());
                    qr.setOptionA(q.getOptionA());
                    qr.setOptionB(q.getOptionB());
                    qr.setOptionC(q.getOptionC());
                    qr.setOptionD(q.getOptionD());
                    // Không trả về correctAnswer khi lấy quiz
                    return qr;
                })
                .collect(Collectors.toList());
        
        response.setQuestions(questionResponses);
        return response;
    }
}
