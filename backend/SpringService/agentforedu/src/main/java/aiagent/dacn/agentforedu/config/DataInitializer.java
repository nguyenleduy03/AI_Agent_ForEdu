package aiagent.dacn.agentforedu.config;

import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.entity.Role;
import aiagent.dacn.agentforedu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Data Initializer - Tự động tạo admin user khi khởi động
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        createDefaultAdminIfNotExists();
    }

    private void createDefaultAdminIfNotExists() {
        // Check if admin already exists
        if (userRepository.existsByUsername("admin")) {
            log.info("✅ Admin user already exists");
            return;
        }

        // Create default admin user
        User admin = new User();
        admin.setUsername("admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setEmail("admin@agentforedu.com");
        admin.setFullName("Administrator");
        admin.setRole(Role.ADMIN);

        userRepository.save(admin);

        log.info("========================================");
        log.info("✅ DEFAULT ADMIN USER CREATED");
        log.info("========================================");
        log.info("Username: admin");
        log.info("Password: admin123");
        log.info("Email: admin@agentforedu.com");
        log.info("Role: ADMIN");
        log.info("========================================");
        log.info("⚠️  PLEASE CHANGE PASSWORD AFTER FIRST LOGIN!");
        log.info("========================================");
    }
}
