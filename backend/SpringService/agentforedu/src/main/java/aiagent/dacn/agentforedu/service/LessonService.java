package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.LessonRequest;
import aiagent.dacn.agentforedu.dto.LessonResponse;
import aiagent.dacn.agentforedu.entity.Lesson;
import aiagent.dacn.agentforedu.entity.Quiz;
import aiagent.dacn.agentforedu.repository.LessonRepository;
import aiagent.dacn.agentforedu.repository.LessonProgressRepository;
import aiagent.dacn.agentforedu.repository.QuizRepository;
import aiagent.dacn.agentforedu.repository.QuizQuestionRepository;
import aiagent.dacn.agentforedu.repository.QuizResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LessonService {
    
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizResultRepository quizResultRepository;
    
    @Transactional(readOnly = true)
    public List<LessonResponse> getLessonsByCourse(Long courseId) {
        return lessonRepository.findByCourseIdOrderByOrderIndexAsc(courseId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public LessonResponse getLessonById(Long id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài học"));
        return toResponse(lesson);
    }
    
    @Transactional
    public LessonResponse createLesson(Long courseId, LessonRequest request) {
        Lesson lesson = new Lesson();
        lesson.setCourseId(courseId);
        lesson.setTitle(request.getTitle());
        lesson.setContent(request.getContent());
        lesson.setOrderIndex(request.getOrderIndex());
        
        Lesson saved = lessonRepository.save(lesson);
        return toResponse(saved);
    }
    
    @Transactional
    public LessonResponse updateLesson(Long id, LessonRequest request) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài học"));
        
        lesson.setTitle(request.getTitle());
        lesson.setContent(request.getContent());
        lesson.setOrderIndex(request.getOrderIndex());
        
        Lesson updated = lessonRepository.save(lesson);
        return toResponse(updated);
    }
    
    @Transactional
    public void deleteLesson(Long id) {
        if (!lessonRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy bài học");
        }
        
        // 1. Delete all quizzes and related data for this lesson
        List<Quiz> quizzes = quizRepository.findByLessonId(id);
        for (Quiz quiz : quizzes) {
            // Delete quiz results first
            quizResultRepository.deleteByQuizId(quiz.getId());
            // Delete quiz questions
            quizQuestionRepository.deleteByQuizId(quiz.getId());
            // Delete quiz
            quizRepository.delete(quiz);
        }
        
        // 2. Delete lesson progress
        lessonProgressRepository.deleteByLessonId(id);
        
        // 3. Finally delete the lesson
        lessonRepository.deleteById(id);
    }
    
    private LessonResponse toResponse(Lesson lesson) {
        LessonResponse response = new LessonResponse();
        response.setId(lesson.getId());
        response.setCourseId(lesson.getCourseId());
        response.setTitle(lesson.getTitle());
        response.setContent(lesson.getContent());
        response.setOrderIndex(lesson.getOrderIndex());
        response.setCreatedAt(lesson.getCreatedAt());
        return response;
    }
}
