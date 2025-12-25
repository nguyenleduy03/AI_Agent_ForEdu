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
        // Giáo viên tạo -> công khai, Sinh viên tạo -> riêng tư
        quiz.setIsPublic(user.getRole() == Role.TEACHER);
        quiz.setTitle("Quiz tự động (" + request.getDifficulty() + ")");
        
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
    public QuizResponse getQuiz(Long quizId, User user) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quiz"));
        
        // Kiểm tra quyền truy cập
        if (user.getRole() != Role.TEACHER) {
            // Sinh viên chỉ xem quiz công khai hoặc quiz tự tạo
            if (!quiz.getIsPublic() && !quiz.getCreatedBy().equals(user.getId())) {
                throw new RuntimeException("Bạn không có quyền xem quiz này");
            }
        }
        
        List<QuizQuestion> questions = questionRepository.findByQuizId(quizId);
        return toQuizResponse(quiz, questions);
    }
    
    @Transactional
    public QuizResultResponse submitQuiz(Long quizId, SubmitQuizRequest request, User user) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy quiz"));
        
        // Kiểm tra quyền truy cập
        if (user.getRole() != Role.TEACHER) {
            // Sinh viên chỉ làm quiz công khai hoặc quiz tự tạo
            if (!quiz.getIsPublic() && !quiz.getCreatedBy().equals(user.getId())) {
                throw new RuntimeException("Bạn không có quyền làm quiz này");
            }
        }
        
        List<QuizQuestion> questions = questionRepository.findByQuizId(quizId);
        
        int correctCount = 0;
        List<QuizResultResponse.QuestionResult> questionResults = new ArrayList<>();
        
        for (QuizQuestion q : questions) {
            String userAnswer = request.getAnswers().get(q.getId());
            boolean isCorrect = userAnswer != null && userAnswer.equalsIgnoreCase(q.getCorrectAnswer());
            if (isCorrect) {
                correctCount++;
            }
            
            // Build question result with answer details
            QuizResultResponse.QuestionResult qr = new QuizResultResponse.QuestionResult();
            qr.setQuestionId(q.getId());
            qr.setQuestion(q.getQuestion());
            qr.setOptionA(q.getOptionA());
            qr.setOptionB(q.getOptionB());
            qr.setOptionC(q.getOptionC());
            qr.setOptionD(q.getOptionD());
            qr.setUserAnswer(userAnswer != null ? userAnswer.toUpperCase() : null);
            qr.setCorrectAnswer(q.getCorrectAnswer());
            qr.setIsCorrect(isCorrect);
            qr.setExplanation(q.getExplanation());
            
            questionResults.add(qr);
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
        response.setQuestionResults(questionResults);
        
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
        response.setTitle(quiz.getTitle());
        response.setDescription(quiz.getDescription());
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
    
    @Transactional
    public QuizResponse createQuiz(CreateQuizRequest request, User user) {
        // Kiểm tra bài học tồn tại
        Lesson lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài học"));
        
        // Tạo quiz
        Quiz quiz = new Quiz();
        quiz.setCourseId(lesson.getCourseId());
        quiz.setLessonId(lesson.getId());
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setCreatedBy(user.getId());
        quiz.setDifficulty(request.getDifficulty() != null ? request.getDifficulty() : QuizDifficulty.MEDIUM);
        // Giáo viên tạo -> công khai, Sinh viên tạo -> riêng tư
        quiz.setIsPublic(user.getRole() == Role.TEACHER);
        
        Quiz savedQuiz = quizRepository.save(quiz);
        
        // Tạo các câu hỏi
        List<QuizQuestion> quizQuestions = new ArrayList<>();
        for (CreateQuizRequest.QuestionRequest qReq : request.getQuestions()) {
            QuizQuestion question = new QuizQuestion();
            question.setQuizId(savedQuiz.getId());
            question.setQuestion(qReq.getQuestion());
            question.setOptionA(qReq.getOptionA());
            question.setOptionB(qReq.getOptionB());
            question.setOptionC(qReq.getOptionC());
            question.setOptionD(qReq.getOptionD());
            question.setCorrectAnswer(qReq.getCorrectAnswer().toUpperCase());
            question.setExplanation(qReq.getExplanation());
            
            quizQuestions.add(questionRepository.save(question));
        }
        
        return toQuizResponse(savedQuiz, quizQuestions);
    }
    
    @Transactional(readOnly = true)
    public List<QuizListResponse> getQuizzesByLesson(Long lessonId, User user) {
        List<Quiz> quizzes = quizRepository.findByLessonIdOrderByCreatedAtDesc(lessonId);
        
        // Lọc quiz theo quyền:
        // - Giáo viên: xem tất cả
        // - Sinh viên: chỉ xem quiz công khai + quiz riêng của mình
        return quizzes.stream()
                .filter(quiz -> {
                    if (user.getRole() == Role.TEACHER) {
                        return true; // Giáo viên xem tất cả
                    }
                    // Sinh viên chỉ xem quiz công khai hoặc quiz tự tạo
                    return quiz.getIsPublic() || quiz.getCreatedBy().equals(user.getId());
                })
                .map(quiz -> {
            QuizListResponse response = new QuizListResponse();
            response.setId(quiz.getId());
            response.setLessonId(quiz.getLessonId());
            response.setTitle(quiz.getTitle());
            response.setDescription(quiz.getDescription());
            response.setDifficulty(quiz.getDifficulty());
            response.setCreatedAt(quiz.getCreatedAt());
            response.setIsPublic(quiz.getIsPublic());
            
            // Đếm số câu hỏi
            int questionCount = questionRepository.countByQuizId(quiz.getId());
            response.setTotalQuestions(questionCount);
            
            // Lấy tên người tạo
            if (quiz.getCreator() != null) {
                response.setCreatorName(quiz.getCreator().getFullName());
            }
            
            // Kiểm tra sinh viên đã làm chưa
            if (user != null && user.getRole() == Role.STUDENT) {
                Optional<QuizResult> lastResult = resultRepository
                        .findTopByQuizIdAndUserIdOrderByCreatedAtDesc(quiz.getId(), user.getId());
                if (lastResult.isPresent()) {
                    response.setIsCompleted(true);
                    response.setLastScore(lastResult.get().getScore());
                } else {
                    response.setIsCompleted(false);
                }
            }
            
            return response;
        }).collect(Collectors.toList());
    }
}

