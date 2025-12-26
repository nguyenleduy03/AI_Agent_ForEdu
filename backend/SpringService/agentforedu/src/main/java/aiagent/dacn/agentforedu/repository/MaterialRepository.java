package aiagent.dacn.agentforedu.repository;

import aiagent.dacn.agentforedu.entity.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {
    List<Material> findByCourseId(Long courseId);
    
    List<Material> findByLessonId(Long lessonId);
    
    List<Material> findByCourseIdAndLessonIdIsNull(Long courseId);
    
    Optional<Material> findByDriveFileId(String driveFileId);
    
    List<Material> findByCourseIdOrderByUploadedAtDesc(Long courseId);
    
    List<Material> findByLessonIdOrderByUploadedAtDesc(Long lessonId);
}
