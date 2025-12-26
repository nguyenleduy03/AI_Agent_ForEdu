package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.MaterialRequest;
import aiagent.dacn.agentforedu.dto.MaterialResponse;
import aiagent.dacn.agentforedu.entity.Material;
import aiagent.dacn.agentforedu.entity.User;
import aiagent.dacn.agentforedu.repository.LessonRepository;
import aiagent.dacn.agentforedu.repository.MaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaterialService {
    
    private final MaterialRepository materialRepository;
    private final LessonRepository lessonRepository;
    private final RestTemplate restTemplate;
    private static final String FASTAPI_URL = "http://localhost:8000";
    
    @Transactional(readOnly = true)
    public List<MaterialResponse> getMaterialsByCourse(Long courseId) {
        return materialRepository.findByCourseIdOrderByUploadedAtDesc(courseId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<MaterialResponse> getMaterialsByLesson(Long lessonId) {
        return materialRepository.findByLessonIdOrderByUploadedAtDesc(lessonId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<MaterialResponse> getCourseMaterialsWithoutLesson(Long courseId) {
        return materialRepository.findByCourseIdAndLessonIdIsNull(courseId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public MaterialResponse uploadMaterial(MaterialRequest request, User user) {
        // 1. Lưu material vào database
        Material material = new Material();
        material.setCourseId(request.getCourseId());
        material.setLessonId(request.getLessonId());
        material.setTitle(request.getTitle());
        material.setDescription(request.getDescription());
        material.setFileUrl(request.getFileUrl());
        material.setType(request.getMaterialType()); // Use helper method
        material.setUploadedBy(user.getId());
        
        // Google Drive fields
        material.setDriveFileId(request.getDriveFileId());
        material.setDriveEmbedLink(request.getDriveEmbedLink());
        material.setDriveDownloadLink(request.getDriveDownloadLink());
        
        // File info
        material.setFileSize(request.getFileSize());
        material.setOriginalFilename(request.getOriginalFilename());
        
        Material saved = materialRepository.save(material);
        
        // 2. Gọi FastAPI để ingest vào RAG (chỉ với file text-based)
        if (isTextBasedFile(request.getMaterialType())) {
            try {
                ingestToRAG(request.getFileUrl(), request.getTitle());
            } catch (Exception e) {
                System.err.println("Lỗi khi ingest vào RAG: " + e.getMessage());
                // Không throw exception, vẫn trả về material đã lưu
            }
        }
        
        return toResponse(saved);
    }
    
    @Transactional
    public void deleteMaterial(Long id) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài liệu"));
        
        // TODO: Xóa file trên Google Drive nếu cần
        // Hiện tại chỉ xóa trong DB, file vẫn còn trên Drive
        
        materialRepository.deleteById(id);
    }
    
    @Transactional
    public void deleteMaterialByDriveFileId(String driveFileId) {
        materialRepository.findByDriveFileId(driveFileId)
                .ifPresent(material -> materialRepository.delete(material));
    }
    
    private boolean isTextBasedFile(aiagent.dacn.agentforedu.entity.MaterialType type) {
        return type == aiagent.dacn.agentforedu.entity.MaterialType.PDF ||
               type == aiagent.dacn.agentforedu.entity.MaterialType.DOC ||
               type == aiagent.dacn.agentforedu.entity.MaterialType.DOCX ||
               type == aiagent.dacn.agentforedu.entity.MaterialType.TXT ||
               type == aiagent.dacn.agentforedu.entity.MaterialType.HTML;
    }
    
    private void ingestToRAG(String fileUrl, String title) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, String> body = new HashMap<>();
            body.put("file_url", fileUrl);
            body.put("title", title);
            
            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            restTemplate.postForObject(FASTAPI_URL + "/api/ai/ingest", request, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi gọi FastAPI ingest: " + e.getMessage());
        }
    }
    
    private MaterialResponse toResponse(Material material) {
        MaterialResponse response = new MaterialResponse();
        response.setId(material.getId());
        response.setCourseId(material.getCourseId());
        response.setLessonId(material.getLessonId());
        response.setTitle(material.getTitle());
        response.setDescription(material.getDescription());
        response.setFileUrl(material.getFileUrl());
        response.setType(material.getType());
        response.setUploadedBy(material.getUploadedBy());
        response.setUploadedAt(material.getUploadedAt());
        
        // Google Drive fields
        response.setDriveFileId(material.getDriveFileId());
        response.setDriveEmbedLink(material.getDriveEmbedLink());
        response.setDriveDownloadLink(material.getDriveDownloadLink());
        
        // File info
        response.setFileSize(material.getFileSize());
        response.setFileSizeFormatted(formatFileSize(material.getFileSize()));
        response.setOriginalFilename(material.getOriginalFilename());
        
        // Uploader name
        if (material.getUploader() != null) {
            response.setUploaderName(material.getUploader().getUsername());
        }
        
        // Lesson title
        if (material.getLessonId() != null && material.getLesson() != null) {
            response.setLessonTitle(material.getLesson().getTitle());
        }
        
        return response;
    }
    
    private String formatFileSize(Long bytes) {
        if (bytes == null || bytes == 0) {
            return "0 B";
        }
        
        String[] units = {"B", "KB", "MB", "GB"};
        int unitIndex = 0;
        double size = bytes;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return String.format("%.1f %s", size, units[unitIndex]);
    }
}
