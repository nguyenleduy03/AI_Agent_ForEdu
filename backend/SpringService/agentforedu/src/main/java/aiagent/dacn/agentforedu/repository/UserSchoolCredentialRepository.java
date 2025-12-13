package aiagent.dacn.agentforedu.repository;

import aiagent.dacn.agentforedu.entity.UserSchoolCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSchoolCredentialRepository extends JpaRepository<UserSchoolCredential, Long> {
    
    Optional<UserSchoolCredential> findByUserId(Long userId);
    
    boolean existsByUserId(Long userId);
    
    void deleteByUserId(Long userId);
}
