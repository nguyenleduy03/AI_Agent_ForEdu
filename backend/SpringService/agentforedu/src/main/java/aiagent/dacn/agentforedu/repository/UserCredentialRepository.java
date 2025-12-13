package aiagent.dacn.agentforedu.repository;

import aiagent.dacn.agentforedu.entity.UserCredential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserCredentialRepository extends JpaRepository<UserCredential, Long> {

    // Find all credentials for a user
    List<UserCredential> findByUserId(Long userId);

    // Find active credentials for a user
    List<UserCredential> findByUserIdAndIsActive(Long userId, Boolean isActive);

    // Find by user and service
    List<UserCredential> findByUserIdAndServiceName(Long userId, String serviceName);

    // Find by user and category
    List<UserCredential> findByUserIdAndCategory(Long userId, UserCredential.CredentialCategory category);

    // Find by user, service and active status
    Optional<UserCredential> findByUserIdAndServiceNameAndIsActive(Long userId, String serviceName, Boolean isActive);

    // Find inactive credentials (not used in X days)
    @Query("SELECT c FROM UserCredential c WHERE c.userId = :userId AND c.isActive = true " +
           "AND (c.lastUsedAt IS NULL OR c.lastUsedAt < :cutoffDate)")
    List<UserCredential> findInactiveCredentials(@Param("userId") Long userId, 
                                                  @Param("cutoffDate") LocalDateTime cutoffDate);

    // Search by purpose or description (for AI)
    @Query("SELECT c FROM UserCredential c WHERE c.userId = :userId AND c.isActive = true " +
           "AND (LOWER(c.purpose) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "OR LOWER(c.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<UserCredential> searchByPurpose(@Param("userId") Long userId, @Param("query") String query);

    // Count credentials by category
    @Query("SELECT c.category, COUNT(c) FROM UserCredential c WHERE c.userId = :userId GROUP BY c.category")
    List<Object[]> countByCategory(@Param("userId") Long userId);

    // Find most used credentials
    @Query("SELECT c FROM UserCredential c WHERE c.userId = :userId AND c.isActive = true " +
           "ORDER BY c.usageCount DESC")
    List<UserCredential> findMostUsed(@Param("userId") Long userId);
}
