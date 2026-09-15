package com.trafficiq.controller;

import com.trafficiq.dto.response.DetectionResponse;
import com.trafficiq.service.DetectionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/detections")
public class DetectionController {

    private final DetectionService detectionService;

    public DetectionController(
            DetectionService detectionService) {

        this.detectionService = detectionService;
    }

    @GetMapping
    public ResponseEntity<List<DetectionResponse>> getDetections(
            @RequestParam String cameraId) {

        List<DetectionResponse> detections =
                detectionService.getDetectionsByCamera(cameraId);

        return ResponseEntity.ok(detections);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<DetectionResponse>> getRecentDetections() {

        List<DetectionResponse> detections =
                detectionService.getRecentDetections();

        return ResponseEntity.ok(detections);
    }
}