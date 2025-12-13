package aiagent.dacn.agentforedu.service;

import aiagent.dacn.agentforedu.dto.MaterialRequest;
import aiagent.dacn.agentforedu.dto.MaterialResponse;
import aiagent.dacn.agentforedu.entity.Material;
import aiagent.dacn.agentforedu.entity.User;
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
    private final RestTemplate restTemplate = new RestTemplate();
    private static final String FASTAPI_URL = "http://localhost:8000";
    
    @Transactional(readOnly = true)
    public List<MaterialResponse> getMaterialsByCourse(Long courseId) {
        return materialRepository.findByCourseId(courseId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public MaterialResponse uploadMaterial(MaterialRequest request, User user) {
        // 1. Lưu material vào database
        Material material = new Material();
        material.setCourseId(request.getCourseId());
        material.setTitle(request.getTitle());
        material.setDescription(request.getDescription());
        material.setFileUrl(request.getFileUrl());
        material.setType(request.getType());
        material.setUploadedBy(user.getId());
        
        Material saved = materialRepository.save(material);
        
        // 2. Gọi FastAPI để ingest vào RAG
        try {
            ingestToRAG(request.getFileUrl(), request.getTitle());
        } catch (Exception e) {
            System.err.println("Lỗi khi ingest vào RAG: " + e.getMessage());
            // Không throw exception, vẫn trả về material đã lưu
        }
        
        return toResponse(saved);
    }
    
    @Transactional
    public void deleteMaterial(Long id) {
        if (!materialRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy tài liệu");
        }
        materialRepository.deleteById(id);
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
        response.setTitle(material.getTitle());
        response.setDescription(material.getDescription());
        response.setFileUrl(material.getFileUrl());
        response.setType(material.getType());
        response.setUploadedBy(material.getUploadedBy());
        response.setUploadedAt(material.getUploadedAt());
        
        if (material.getUploader() != null) {
            response.setUploaderName(material.getUploader().getUsername());
        }
        
        return response;
    }
}
