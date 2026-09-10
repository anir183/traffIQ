package com.trafficiq.trafficiq_backend.controller;

import com.trafficiq.trafficiq_backend.dto.response.DetectionResponse;
import com.trafficiq.trafficiq_backend.service.DetectionService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/detections")
public class DetectionController {

    private final DetectionService detectionService;


    public DetectionController(
            DetectionService detectionService
    ) {
        this.detectionService =
                detectionService;
    }


    @GetMapping("/recent")
    public List<DetectionResponse> getRecentDetections() {

        return detectionService
                .getRecentDetections();
    }


    @GetMapping("/vehicle/{plateNumber}")
    public List<DetectionResponse> getDetectionsByVehicle(
            @PathVariable String plateNumber
    ) {

        return detectionService
                .getDetectionsByVehicle(
                        plateNumber
                );
    }


    @GetMapping("/camera/{cameraId}")
    public List<DetectionResponse> getDetectionsByCamera(
            @PathVariable String cameraId
    ) {

        return detectionService
                .getDetectionsByCamera(
                        cameraId
                );
    }
}