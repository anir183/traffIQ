package com.trafficiq.trafficiq_backend.service;
import com.trafficiq.trafficiq_backend.dto.input.MlDetectionRequest;
import com.trafficiq.trafficiq_backend.dto.response.MlIngestResponse;

import com.trafficiq.trafficiq_backend.repository.AlertRepository;
import com.trafficiq.trafficiq_backend.repository.CameraRepository;
import com.trafficiq.trafficiq_backend.repository.DetectionRepository;
import com.trafficiq.trafficiq_backend.repository.VehicleRepository;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class MlDetectionService {

    private final CameraRepository cameraRepository;

    private final VehicleRepository vehicleRepository;

    private final DetectionRepository detectionRepository;

    private final AlertRepository alertRepository;


    public MlDetectionService(
            CameraRepository cameraRepository,
            VehicleRepository vehicleRepository,
            DetectionRepository detectionRepository,
            AlertRepository alertRepository
    ) {
        this.cameraRepository = cameraRepository;
        this.vehicleRepository = vehicleRepository;
        this.detectionRepository = detectionRepository;
        this.alertRepository = alertRepository;
    }


    // ==========================================
    // MAIN ML PROCESSING METHOD
    // ==========================================

    public MlIngestResponse processDetection(
            MlDetectionRequest request
    ) {

        return null;
    }


    // ==========================================
    // CONVERT ML TIMESTAMP
    // ==========================================

    private LocalDateTime convertTimestamp(
            String timestamp
    ) {

        return Instant
                .parse(timestamp)
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
    }
}
