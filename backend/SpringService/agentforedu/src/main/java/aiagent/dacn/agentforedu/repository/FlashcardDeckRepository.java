package aiagent.dacn.agentforedu.repository;

import aiagent.dacn.agentforedu.entity.FlashcardDeck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FlashcardDeckRepository extends JpaRepository<FlashcardDeck, Long> {
    
    List<FlashcardDeck> findByUserId(Long userId);
    
    List<FlashcardDeck> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<FlashcardDeck> findByIsPublicTrue();
    
    Optional<FlashcardDeck> findByIdAndUserId(Long id, Long userId);
    
    @Query("SELECT d FROM FlashcardDeck d WHERE d.userId = :userId AND d.name LIKE %:keyword%")
    List<FlashcardDeck> searchByName(@Param("userId") Long userId, @Param("keyword") String keyword);
    
    Long countByUserId(Long userId);
    
    @Query("SELECT f.deck.id FROM Flashcard f WHERE f.id = :flashcardId")
    Optional<Long> findDeckIdByFlashcardId(@Param("flashcardId") Long flashcardId);
}
