package com.trafficiq.controller;

import com.trafficiq.dto.input.MlDetectionRequest;
import com.trafficiq.dto.response.MlIngestResponse;
import com.trafficiq.service.MlDetectionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ml/detections")
public class MlDetectionController {

    private final MlDetectionService mlDetectionService;

    public MlDetectionController(
            MlDetectionService mlDetectionService) {
        this.mlDetectionService = mlDetectionService;
    }

    @PostMapping
    public ResponseEntity<MlIngestResponse> ingestDetection(
            @Valid @RequestBody MlDetectionRequest request) {

        MlIngestResponse response =
                mlDetectionService.ingestDetection(request);

        return ResponseEntity.ok(response);
    }
}