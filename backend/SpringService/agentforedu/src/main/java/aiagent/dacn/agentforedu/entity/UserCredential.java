package aiagent.dacn.agentforedu.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "user_credentials")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    // Service info
    @Column(name = "service_name", nullable = false, length = 100)
    private String serviceName;

    @Column(name = "service_url", length = 500)
    private String serviceUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "service_type")
    private ServiceType serviceType = ServiceType.WEB;

    // Credentials (encrypted)
    @JsonIgnore
    @Column(name = "encrypted_username", nullable = false, length = 500)
    private String encryptedUsername;

    @JsonIgnore
    @Column(name = "encrypted_password", nullable = false, columnDefinition = "TEXT")
    private String encryptedPassword;

    // Metadata for AI
    @Column(name = "purpose", nullable = false, columnDefinition = "TEXT")
    private String purpose;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Organization
    @Enumerated(EnumType.STRING)
    @Column(name = "category")
    private CredentialCategory category = CredentialCategory.OTHER;

    @Column(name = "tags", columnDefinition = "JSON")
    private String tags; // JSON array: ["school", "schedule"]

    @Column(name = "label", length = 100)
    private String label;

    // Status
    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "is_shared")
    private Boolean isShared = false;

    // Usage tracking
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    @Column(name = "usage_count")
    private Integer usageCount = 0;

    @Column(name = "last_success")
    private Boolean lastSuccess;

    // Timestamps
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Transient fields for decrypted values (not stored in DB)
    @Transient
    private String username;

    @Transient
    private String password;

    // Helper method to parse tags
    @Transient
    public List<String> getTagsList() {
        if (tags == null || tags.isEmpty()) {
            return List.of();
        }
        try {
            // Simple JSON array parsing
            return List.of(tags.replace("[", "").replace("]", "")
                    .replace("\"", "").split(","));
        } catch (Exception e) {
            return List.of();
        }
    }

    public enum ServiceType {
        WEB, API, APP, OTHER
    }

    public enum CredentialCategory {
        EDUCATION, ENTERTAINMENT, SOCIAL, WORK, FINANCE, HEALTH, OTHER
    }
}
