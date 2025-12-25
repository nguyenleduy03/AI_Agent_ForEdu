package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.*;
import aiagent.dacn.agentforedu.entity.*;
import aiagent.dacn.agentforedu.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherAnalyticsService {

    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseProgressRepository courseProgressRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final QuizRepository quizRepository;
    private final QuizResultRepository quizResultRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final MaterialRepository materialRepository;
    private final UserRepository userRepository;

    /**
     * Get detailed student info with quiz history
     */
    @Transactional(readOnly = true)
    public StudentDetailResponse getStudentDetail(Long courseId, Long studentId, User teacher) {
        Course course = validateTeacherAccess(courseId, teacher);
        
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sinh viên"));
        
        // Check if student is enrolled
        CourseEnrollment enrollment = enrollmentRepository
                .findByUserIdAndCourseId(studentId, courseId)
                .orElseThrow(() -> new RuntimeException("Sinh viên không có trong khóa học này"));
        
        StudentDetailResponse response = new StudentDetailResponse();
        
        // Basic info
        response.setUserId(student.getId());
        response.setUsername(student.getUsername());
        response.setFullName(student.getFullName());
        response.setEmail(student.getEmail());
        response.setAvatarUrl(student.getAvatarUrl());
        response.setEnrolledAt(enrollment.getEnrolledAt());
        
        // Progress info
        CourseProgress progress = courseProgressRepository
                .findByUserIdAndCourseId(studentId, courseId)
                .orElse(null);
        
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        
        if (progress != null) {
            response.setProgressPercentage(progress.getProgressPercentage());
            response.setCompletedLessons(progress.getCompletedLessons());
            response.setTotalLessons(progress.getTotalLessons());
            response.setTotalTimeSpent(progress.getTotalTimeSpent());
            response.setLastAccessedAt(progress.getLastAccessedAt());
        } else {
            response.setProgressPercentage(BigDecimal.ZERO);
            response.setCompletedLessons(0);
            response.setTotalLessons(lessons.size());
            response.setTotalTimeSpent(0);
        }
        
        // Quiz history
        List<QuizResult> quizResults = quizResultRepository.findByUserIdAndCourseId(studentId, courseId);
        List<StudentQuizResultResponse> quizHistory = new ArrayList<>();
        
        Map<Long, Integer> attemptCountMap = new HashMap<>();
        
        for (QuizResult result : quizResults) {
            Quiz quiz = result.getQuiz();
            if (quiz == null) continue;
            
            Lesson lesson = lessonRepository.findById(quiz.getLessonId()).orElse(null);
            int totalQuestions = quizQuestionRepository.findByQuizId(quiz.getId()).size();
            
            // Count attempt number
            Long quizId = quiz.getId();
            int attemptNumber = attemptCountMap.getOrDefault(quizId, 0) + 1;
            attemptCountMap.put(quizId, attemptNumber);
            
            StudentQuizResultResponse qr = new StudentQuizResultResponse();
            qr.setResultId(result.getId());
            qr.setQuizId(quiz.getId());
            qr.setQuizTitle(quiz.getTitle());
            qr.setLessonId(quiz.getLessonId());
            qr.setLessonTitle(lesson != null ? lesson.getTitle() : "N/A");
            qr.setScore(result.getScore());
            qr.setTotalQuestions(totalQuestions);
            qr.setPercentage(totalQuestions > 0 ? (result.getScore() / totalQuestions) * 100 : 0);
            qr.setCompletedAt(result.getCreatedAt());
            qr.setAttemptNumber(attemptNumber);
            
            quizHistory.add(qr);
        }
        
        response.setQuizHistory(quizHistory);
        
        // Quiz stats
        if (!quizResults.isEmpty()) {
            response.setTotalQuizzesTaken(quizResults.size());
            
            long passedCount = quizHistory.stream()
                    .filter(q -> q.getPercentage() >= 50)
                    .count();
            response.setTotalQuizzesPassed((int) passedCount);
            
            DoubleSummaryStatistics stats = quizHistory.stream()
                    .mapToDouble(StudentQuizResultResponse::getPercentage)
                    .summaryStatistics();
            
            response.setAverageQuizScore(Math.round(stats.getAverage() * 100.0) / 100.0);
            response.setHighestQuizScore(stats.getMax());
            response.setLowestQuizScore(stats.getMin());
        } else {
            response.setTotalQuizzesTaken(0);
            response.setTotalQuizzesPassed(0);
            response.setAverageQuizScore(0.0);
            response.setHighestQuizScore(0.0);
            response.setLowestQuizScore(0.0);
        }
        
        // Lesson progress
        List<LessonProgress> lessonProgressList = lessonProgressRepository
                .findByUserIdAndCourseId(studentId, courseId);
        
        List<LessonProgressResponse> lessonProgressResponses = lessons.stream()
                .map(lesson -> {
                    LessonProgress lp = lessonProgressList.stream()
                            .filter(p -> p.getLessonId().equals(lesson.getId()))
                            .findFirst()
                            .orElse(null);
                    
                    LessonProgressResponse lpr = new LessonProgressResponse();
                    lpr.setLessonId(lesson.getId());
                    lpr.setLessonTitle(lesson.getTitle());
                    
                    if (lp != null) {
                        lpr.setId(lp.getId());
                        lpr.setUserId(lp.getUserId());
                        lpr.setCourseId(lp.getCourseId());
                        lpr.setIsCompleted(lp.getIsCompleted());
                        lpr.setCompletedAt(lp.getCompletedAt());
                        lpr.setTimeSpent(lp.getTimeSpent());
                        lpr.setProgressPercentage(lp.getProgressPercentage() != null ? lp.getProgressPercentage().intValue() : 0);
                        lpr.setLastAccessedAt(lp.getLastAccessedAt());
                    } else {
                        lpr.setUserId(studentId);
                        lpr.setCourseId(courseId);
                        lpr.setIsCompleted(false);
                        lpr.setTimeSpent(0);
                        lpr.setProgressPercentage(0);
                    }
                    
                    return lpr;
                })
                .collect(Collectors.toList());
        
        response.setLessonProgress(lessonProgressResponses);
        
        return response;
    }

    /**
     * Get course analytics overview
     */
    @Transactional(readOnly = true)
    public CourseAnalyticsResponse getCourseAnalytics(Long courseId, User teacher) {
        Course course = validateTeacherAccess(courseId, teacher);
        
        CourseAnalyticsResponse response = new CourseAnalyticsResponse();
        
        // Course info
        response.setCourseId(course.getId());
        response.setCourseTitle(course.getTitle());
        response.setCourseDescription(course.getDescription());
        response.setCreatedAt(course.getCreatedAt());
        
        // Get all data
        List<CourseEnrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        List<Lesson> lessons = lessonRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        List<Quiz> quizzes = new ArrayList<>();
        for (Lesson lesson : lessons) {
            quizzes.addAll(quizRepository.findByLessonId(lesson.getId()));
        }
        List<Material> materials = materialRepository.findByCourseId(courseId);
        List<QuizResult> allQuizResults = quizResultRepository.findByCourseId(courseId);
        
        // Overview stats
        response.setTotalStudents(enrollments.size());
        response.setTotalLessons(lessons.size());
        response.setTotalQuizzes(quizzes.size());
        response.setTotalMaterials(materials.size());
        
        // Progress stats
        List<CourseProgress> allProgress = enrollments.stream()
                .map(e -> courseProgressRepository.findByUserIdAndCourseId(e.getUserId(), courseId).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        
        double avgProgress = allProgress.stream()
                .mapToDouble(p -> p.getProgressPercentage().doubleValue())
                .average()
                .orElse(0);
        response.setAverageProgress(Math.round(avgProgress * 100.0) / 100.0);
        
        int completed = (int) allProgress.stream().filter(p -> p.getProgressPercentage().doubleValue() >= 100).count();
        int inProgress = (int) allProgress.stream().filter(p -> {
            double pct = p.getProgressPercentage().doubleValue();
            return pct > 0 && pct < 100;
        }).count();
        int notStarted = enrollments.size() - completed - inProgress;
        
        response.setStudentsCompleted(completed);
        response.setStudentsInProgress(inProgress);
        response.setStudentsNotStarted(Math.max(0, notStarted));
        
        // Quiz stats
        response.setTotalQuizAttempts(allQuizResults.size());
        
        if (!allQuizResults.isEmpty()) {
            // Calculate percentage scores
            List<Double> percentageScores = allQuizResults.stream()
                    .map(qr -> {
                        int totalQ = quizQuestionRepository.findByQuizId(qr.getQuizId()).size();
                        return totalQ > 0 ? (qr.getScore() / totalQ) * 100 : 0.0;
                    })
                    .collect(Collectors.toList());
            
            double avgScore = percentageScores.stream().mapToDouble(d -> d).average().orElse(0);
            response.setAverageQuizScore(Math.round(avgScore * 100.0) / 100.0);
            
            long passedCount = percentageScores.stream().filter(s -> s >= 50).count();
            response.setPassRate(Math.round((passedCount * 100.0 / percentageScores.size()) * 100.0) / 100.0);
        } else {
            response.setAverageQuizScore(0.0);
            response.setPassRate(0.0);
        }
        
        // Time stats
        int totalTime = allProgress.stream().mapToInt(p -> p.getTotalTimeSpent() != null ? p.getTotalTimeSpent() : 0).sum();
        response.setTotalStudyTime(totalTime);
        response.setAverageStudyTime(enrollments.isEmpty() ? 0 : (double) totalTime / enrollments.size());
        
        // Lesson analytics
        List<CourseAnalyticsResponse.LessonAnalytics> lessonAnalytics = lessons.stream()
                .map(lesson -> {
                    List<LessonProgress> lpList = lessonProgressRepository.findByLessonId(lesson.getId());
                    
                    int lessonCompleted = (int) lpList.stream().filter(LessonProgress::getIsCompleted).count();
                    int lessonInProgress = (int) lpList.stream().filter(lp -> !lp.getIsCompleted() && lp.getProgressPercentage().doubleValue() > 0).count();
                    int lessonTotalTime = lpList.stream().mapToInt(lp -> lp.getTimeSpent() != null ? lp.getTimeSpent() : 0).sum();
                    
                    CourseAnalyticsResponse.LessonAnalytics la = new CourseAnalyticsResponse.LessonAnalytics();
                    la.setLessonId(lesson.getId());
                    la.setLessonTitle(lesson.getTitle());
                    la.setOrderIndex(lesson.getOrderIndex());
                    la.setStudentsCompleted(lessonCompleted);
                    la.setStudentsInProgress(lessonInProgress);
                    la.setCompletionRate(enrollments.isEmpty() ? 0 : (lessonCompleted * 100.0 / enrollments.size()));
                    la.setTotalTimeSpent(lessonTotalTime);
                    la.setAverageTimeSpent(lpList.isEmpty() ? 0 : (double) lessonTotalTime / lpList.size());
                    
                    return la;
                })
                .collect(Collectors.toList());
        response.setLessonAnalytics(lessonAnalytics);
        
        // Quiz analytics
        List<CourseAnalyticsResponse.QuizAnalytics> quizAnalytics = quizzes.stream()
                .map(quiz -> {
                    List<QuizResult> qrList = quizResultRepository.findByQuizId(quiz.getId());
                    Lesson lesson = lessonRepository.findById(quiz.getLessonId()).orElse(null);
                    int totalQuestions = quizQuestionRepository.findByQuizId(quiz.getId()).size();
                    
                    CourseAnalyticsResponse.QuizAnalytics qa = new CourseAnalyticsResponse.QuizAnalytics();
                    qa.setQuizId(quiz.getId());
                    qa.setQuizTitle(quiz.getTitle());
                    qa.setLessonId(quiz.getLessonId());
                    qa.setLessonTitle(lesson != null ? lesson.getTitle() : "N/A");
                    qa.setTotalAttempts(qrList.size());
                    qa.setUniqueStudents((int) qrList.stream().map(QuizResult::getUserId).distinct().count());
                    
                    if (!qrList.isEmpty() && totalQuestions > 0) {
                        DoubleSummaryStatistics stats = qrList.stream()
                                .mapToDouble(qr -> (qr.getScore() / totalQuestions) * 100)
                                .summaryStatistics();
                        
                        qa.setAverageScore(Math.round(stats.getAverage() * 100.0) / 100.0);
                        qa.setHighestScore(stats.getMax());
                        qa.setLowestScore(stats.getMin());
                        
                        long passed = qrList.stream()
                                .filter(qr -> (qr.getScore() / totalQuestions) * 100 >= 50)
                                .count();
                        qa.setPassRate(Math.round((passed * 100.0 / qrList.size()) * 100.0) / 100.0);
                    } else {
                        qa.setAverageScore(0.0);
                        qa.setHighestScore(0.0);
                        qa.setLowestScore(0.0);
                        qa.setPassRate(0.0);
                    }
                    
                    return qa;
                })
                .collect(Collectors.toList());
        response.setQuizAnalytics(quizAnalytics);
        
        // Top students (by progress + quiz score)
        List<CourseAnalyticsResponse.StudentRankingResponse> topStudents = enrollments.stream()
                .map(enrollment -> {
                    User student = userRepository.findById(enrollment.getUserId()).orElse(null);
                    if (student == null) return null;
                    
                    CourseProgress cp = courseProgressRepository
                            .findByUserIdAndCourseId(enrollment.getUserId(), courseId)
                            .orElse(null);
                    
                    List<QuizResult> studentQuizResults = quizResultRepository
                            .findByUserIdAndCourseId(enrollment.getUserId(), courseId);
                    
                    double avgQuizScore = 0;
                    if (!studentQuizResults.isEmpty()) {
                        avgQuizScore = studentQuizResults.stream()
                                .mapToDouble(qr -> {
                                    int totalQ = quizQuestionRepository.findByQuizId(qr.getQuizId()).size();
                                    return totalQ > 0 ? (qr.getScore() / totalQ) * 100 : 0;
                                })
                                .average()
                                .orElse(0);
                    }
                    
                    CourseAnalyticsResponse.StudentRankingResponse sr = new CourseAnalyticsResponse.StudentRankingResponse();
                    sr.setUserId(student.getId());
                    sr.setUsername(student.getUsername());
                    sr.setFullName(student.getFullName());
                    sr.setProgressPercentage(cp != null ? cp.getProgressPercentage().doubleValue() : 0);
                    sr.setAverageQuizScore(Math.round(avgQuizScore * 100.0) / 100.0);
                    sr.setTotalTimeSpent(cp != null && cp.getTotalTimeSpent() != null ? cp.getTotalTimeSpent() : 0);
                    
                    return sr;
                })
                .filter(Objects::nonNull)
                .sorted((a, b) -> {
                    // Sort by progress first, then by quiz score
                    double scoreA = a.getProgressPercentage() * 0.6 + a.getAverageQuizScore() * 0.4;
                    double scoreB = b.getProgressPercentage() * 0.6 + b.getAverageQuizScore() * 0.4;
                    return Double.compare(scoreB, scoreA);
                })
                .limit(10)
                .collect(Collectors.toList());
        
        // Set ranks
        for (int i = 0; i < topStudents.size(); i++) {
            topStudents.get(i).setRank(i + 1);
        }
        response.setTopStudents(topStudents);
        
        return response;
    }

    private Course validateTeacherAccess(Long courseId, User teacher) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khóa học"));
        
        if (!course.getCreatedBy().equals(teacher.getId())) {
            throw new RuntimeException("Bạn không có quyền quản lý khóa học này");
        }
        
        return course;
    }
}
