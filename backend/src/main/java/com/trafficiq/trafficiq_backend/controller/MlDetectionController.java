package com.trafficiq.trafficiq_backend.controller;

import com.trafficiq.trafficiq_backend.dto.input.MlDetectionRequest;
import com.trafficiq.trafficiq_backend.dto.response.MlIngestResponse;
import com.trafficiq.trafficiq_backend.service.MlDetectionService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ml")
public class MlDetectionController {

    private final MlDetectionService mlDetectionService;

    public MlDetectionController(
            MlDetectionService mlDetectionService
    ) {
        this.mlDetectionService = mlDetectionService;
    }


    @PostMapping("/detections")
    public ResponseEntity<MlIngestResponse> receiveDetection(

            @Valid
            @RequestBody
            MlDetectionRequest request
    ) {

        MlIngestResponse response =
                mlDetectionService.processDetection(
                        request
                );

        return ResponseEntity.ok(response);
    }
}
