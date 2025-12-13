package aiagent.dacn.agentforedu.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/test-school-credentials")
public class TestSchoolCredentialController {
    
    @GetMapping
    public ResponseEntity<?> test() {
        return ResponseEntity.ok(Map.of(
            "message", "Test endpoint works!",
            "status", "OK"
        ));
    }
    
    @PostMapping
    public ResponseEntity<?> testPost(@RequestBody Map<String, String> data) {
        return ResponseEntity.ok(Map.of(
            "message", "Post works!",
            "received", data
        ));
    }
}
