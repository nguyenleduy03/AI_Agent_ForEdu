package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.AssistantReminderResponse;
import aiagent.dacn.agentforedu.dto.AssistantReminderResponse.Reminder;
import aiagent.dacn.agentforedu.dto.AssistantReminderResponse.ReminderType;
import aiagent.dacn.agentforedu.dto.AssistantReminderResponse.ReminderPriority;
import aiagent.dacn.agentforedu.entity.*;
import aiagent.dacn.agentforedu.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssistantService {

    private final QuizRepository quizRepository;
    private final QuizResultRepository quizResultRepository;
    private final FlashcardStatsRepository flashcardStatsRepository;
    private final FlashcardDeckRepository flashcardDeckRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final LessonRepository lessonRepository;
    private final CourseRepository courseRepository;

    @Transactional(readOnly = true)
    public AssistantReminderResponse getReminders(User user) {
        List<Reminder> reminders = new ArrayList<>();

        if (user.getRole() == Role.STUDENT) {
            reminders.addAll(getStudentReminders(user));
        } else if (user.getRole() == Role.TEACHER) {
            reminders.addAll(getTeacherReminders(user));
        }

        // Sắp xếp theo priority
        reminders.sort((a, b) -> {
            int priorityCompare = a.getPriority().ordinal() - b.getPriority().ordinal();
            if (priorityCompare != 0) return priorityCompare;
            // Nếu cùng priority, sắp xếp theo deadline
            if (a.getDeadline() != null && b.getDeadline() != null) {
                return a.getDeadline().compareTo(b.getDeadline());
            }
            return 0;
        });

        int urgentCount = (int) reminders.stream()
                .filter(r -> r.getPriority() == ReminderPriority.URGENT)
                .count();

        return AssistantReminderResponse.builder()
                .reminders(reminders)
                .totalCount(reminders.size())
                .urgentCount(urgentCount)
                .build();
    }

    private List<Reminder> getStudentReminders(User user) {
        List<Reminder> reminders = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // 1. Quiz sắp hết hạn (trong 3 ngày tới)
        reminders.addAll(getUpcomingQuizDeadlines(user, now));

        // 2. Flashcard cần ôn tập
        reminders.addAll(getDueFlashcards(user, now));

        // 3. Bài học chưa hoàn thành
        reminders.addAll(getIncompleteLessons(user));

        // 4. Tiến độ khóa học thấp
        reminders.addAll(getLowProgressCourses(user));

        return reminders;
    }

    private List<Reminder> getTeacherReminders(User user) {
        List<Reminder> reminders = new ArrayList<>();

        // 1. Quiz chưa có ai làm
        reminders.addAll(getQuizzesWithNoAttempts(user));

        // 2. Quiz có điểm trung bình thấp
        reminders.addAll(getLowScoreQuizzes(user));

        return reminders;
    }

    // ==================== STUDENT REMINDERS ====================

    private List<Reminder> getUpcomingQuizDeadlines(User user, LocalDateTime now) {
        List<Reminder> reminders = new ArrayList<>();
        LocalDateTime threeDaysLater = now.plusDays(3);

        // Lấy các khóa học đã đăng ký
        List<Long> enrolledCourseIds = enrollmentRepository.findByUserId(user.getId())
                .stream()
                .map(CourseEnrollment::getCourseId)
                .collect(Collectors.toList());

        if (enrolledCourseIds.isEmpty()) return reminders;

        // Lấy tất cả quiz công khai trong các khóa học đã đăng ký
        for (Long courseId : enrolledCourseIds) {
            List<Quiz> quizzes = quizRepository.findByCourseId(courseId);
            
            for (Quiz quiz : quizzes) {
                // Chỉ xét quiz công khai, có deadline, chưa hết hạn
                if (!Boolean.TRUE.equals(quiz.getIsPublic())) continue;
                if (quiz.getDeadline() == null) continue;
                if (quiz.getDeadline().isBefore(now)) continue;
                if (quiz.getDeadline().isAfter(threeDaysLater)) continue;

                // Kiểm tra đã làm chưa
                int attemptCount = quizResultRepository.countByQuizIdAndUserId(quiz.getId(), user.getId());
                if (quiz.getMaxAttempts() != null && attemptCount >= quiz.getMaxAttempts()) continue;
                if (attemptCount > 0) continue; // Đã làm rồi

                long hoursLeft = ChronoUnit.HOURS.between(now, quiz.getDeadline());
                ReminderPriority priority;
                String timeMessage;

                if (hoursLeft <= 24) {
                    priority = ReminderPriority.URGENT;
                    timeMessage = hoursLeft <= 1 ? "còn chưa đầy 1 giờ" : "còn " + hoursLeft + " giờ";
                } else {
                    long daysLeft = ChronoUnit.DAYS.between(now, quiz.getDeadline());
                    priority = daysLeft <= 1 ? ReminderPriority.HIGH : ReminderPriority.MEDIUM;
                    timeMessage = "còn " + daysLeft + " ngày";
                }

                reminders.add(Reminder.builder()
                        .id("quiz_" + quiz.getId())
                        .type(ReminderType.QUIZ_DEADLINE)
                        .priority(priority)
                        .title("Quiz sắp hết hạn!")
                        .message("\"" + quiz.getTitle() + "\" " + timeMessage + " nữa là hết hạn")
                        .icon("⏰")
                        .actionUrl("/quiz/" + quiz.getId())
                        .deadline(quiz.getDeadline())
                        .metadata(Map.of(
                                "quizId", quiz.getId(),
                                "lessonId", quiz.getLessonId(),
                                "difficulty", quiz.getDifficulty()
                        ))
                        .build());
            }
        }

        return reminders;
    }

    private List<Reminder> getDueFlashcards(User user, LocalDateTime now) {
        List<Reminder> reminders = new ArrayList<>();

        // Lấy flashcard cần ôn
        List<FlashcardStats> dueCards = flashcardStatsRepository.findDueCards(user.getId(), now);
        
        if (dueCards.isEmpty()) return reminders;

        // Nhóm theo deck
        Map<Long, List<FlashcardStats>> cardsByDeck = dueCards.stream()
                .collect(Collectors.groupingBy(fs -> {
                    // Lấy deckId từ flashcard
                    return flashcardDeckRepository.findDeckIdByFlashcardId(fs.getFlashcardId())
                            .orElse(0L);
                }));

        for (Map.Entry<Long, List<FlashcardStats>> entry : cardsByDeck.entrySet()) {
            Long deckId = entry.getKey();
            int dueCount = entry.getValue().size();
            
            if (deckId == 0L || dueCount == 0) continue;

            FlashcardDeck deck = flashcardDeckRepository.findById(deckId).orElse(null);
            if (deck == null) continue;

            ReminderPriority priority = dueCount >= 20 ? ReminderPriority.HIGH 
                    : dueCount >= 10 ? ReminderPriority.MEDIUM 
                    : ReminderPriority.LOW;

            reminders.add(Reminder.builder()
                    .id("flashcard_" + deckId)
                    .type(ReminderType.FLASHCARD_DUE)
                    .priority(priority)
                    .title("Flashcard cần ôn tập")
                    .message("Bộ \"" + deck.getName() + "\" có " + dueCount + " thẻ cần ôn")
                    .icon("🧠")
                    .actionUrl("/flashcards/deck/" + deckId + "/study")
                    .metadata(Map.of(
                            "deckId", deckId,
                            "dueCount", dueCount,
                            "deckName", deck.getName()
                    ))
                    .build());
        }

        return reminders;
    }

    private List<Reminder> getIncompleteLessons(User user) {
        List<Reminder> reminders = new ArrayList<>();

        // Lấy các khóa học đã đăng ký
        List<CourseEnrollment> enrollments = enrollmentRepository.findByUserId(user.getId());
        
        for (CourseEnrollment enrollment : enrollments) {
            Course course = enrollment.getCourse();
            if (course == null) continue;

            List<Lesson> lessons = lessonRepository.findByCourseIdOrderByOrderIndexAsc(course.getId());
            
            // Đếm bài học chưa hoàn thành
            int incompleteCount = 0;
            Lesson firstIncomplete = null;
            
            for (Lesson lesson : lessons) {
                Optional<LessonProgress> progress = lessonProgressRepository
                        .findByUserIdAndLessonId(user.getId(), lesson.getId());
                
                if (progress.isEmpty() || !Boolean.TRUE.equals(progress.get().getIsCompleted())) {
                    incompleteCount++;
                    if (firstIncomplete == null) {
                        firstIncomplete = lesson;
                    }
                }
            }

            if (incompleteCount > 0 && firstIncomplete != null) {
                reminders.add(Reminder.builder()
                        .id("lesson_" + course.getId())
                        .type(ReminderType.LESSON_INCOMPLETE)
                        .priority(ReminderPriority.LOW)
                        .title("Bài học chưa hoàn thành")
                        .message("Khóa \"" + course.getTitle() + "\" còn " + incompleteCount + " bài chưa học")
                        .icon("📚")
                        .actionUrl("/lessons/" + firstIncomplete.getId())
                        .metadata(Map.of(
                                "courseId", course.getId(),
                                "incompleteCount", incompleteCount,
                                "firstLessonId", firstIncomplete.getId()
                        ))
                        .build());
            }
        }

        return reminders;
    }

    private List<Reminder> getLowProgressCourses(User user) {
        // Có thể implement sau nếu cần
        return new ArrayList<>();
    }

    // ==================== TEACHER REMINDERS ====================

    private List<Reminder> getQuizzesWithNoAttempts(User user) {
        List<Reminder> reminders = new ArrayList<>();
        LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);

        // Lấy quiz do giáo viên tạo
        List<Course> courses = courseRepository.findByCreatedBy(user.getId());
        
        for (Course course : courses) {
            List<Quiz> quizzes = quizRepository.findByCourseId(course.getId());
            
            for (Quiz quiz : quizzes) {
                if (!Boolean.TRUE.equals(quiz.getIsPublic())) continue;
                if (quiz.getCreatedAt().isAfter(oneWeekAgo)) continue; // Quiz mới tạo

                // Đếm số lượt làm
                Integer attemptCount = quizResultRepository.countUniqueStudentsByQuizId(quiz.getId());
                
                if (attemptCount == null || attemptCount == 0) {
                    reminders.add(Reminder.builder()
                            .id("teacher_quiz_" + quiz.getId())
                            .type(ReminderType.QUIZ_NO_ATTEMPT)
                            .priority(ReminderPriority.MEDIUM)
                            .title("Quiz chưa có ai làm")
                            .message("\"" + quiz.getTitle() + "\" chưa có sinh viên nào làm bài")
                            .icon("📝")
                            .actionUrl("/lessons/" + quiz.getLessonId())
                            .metadata(Map.of(
                                    "quizId", quiz.getId(),
                                    "courseId", course.getId()
                            ))
                            .build());
                }
            }
        }

        return reminders;
    }

    private List<Reminder> getLowScoreQuizzes(User user) {
        List<Reminder> reminders = new ArrayList<>();

        List<Course> courses = courseRepository.findByCreatedBy(user.getId());
        
        for (Course course : courses) {
            List<Quiz> quizzes = quizRepository.findByCourseId(course.getId());
            
            for (Quiz quiz : quizzes) {
                if (!Boolean.TRUE.equals(quiz.getIsPublic())) continue;

                Double avgScore = quizResultRepository.getAverageScoreByQuizId(quiz.getId());
                Integer studentCount = quizResultRepository.countUniqueStudentsByQuizId(quiz.getId());
                
                if (avgScore != null && avgScore < 50 && studentCount != null && studentCount >= 3) {
                    reminders.add(Reminder.builder()
                            .id("low_score_" + quiz.getId())
                            .type(ReminderType.LOW_SCORE_ALERT)
                            .priority(ReminderPriority.HIGH)
                            .title("Điểm trung bình thấp")
                            .message("\"" + quiz.getTitle() + "\" có điểm TB: " + String.format("%.1f", avgScore) + "%")
                            .icon("⚠️")
                            .actionUrl("/lessons/" + quiz.getLessonId())
                            .metadata(Map.of(
                                    "quizId", quiz.getId(),
                                    "avgScore", avgScore,
                                    "studentCount", studentCount
                            ))
                            .build());
                }
            }
        }

        return reminders;
    }
}
