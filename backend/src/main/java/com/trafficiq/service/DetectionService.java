package com.trafficiq.service;

import com.trafficiq.dto.response.DetectionResponse;
import com.trafficiq.entity.Camera;
import com.trafficiq.entity.Detection;
import com.trafficiq.repository.CameraRepository;
import com.trafficiq.repository.DetectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DetectionService {

    private final DetectionRepository detectionRepository;
    private final CameraRepository cameraRepository;

    public DetectionService(
            DetectionRepository detectionRepository,
            CameraRepository cameraRepository) {

        this.detectionRepository = detectionRepository;
        this.cameraRepository = cameraRepository;
    }

    @Transactional(readOnly = true)
    public List<DetectionResponse> getDetectionsByCamera(
            String cameraId) {

        if (cameraId == null || cameraId.isBlank()) {
            throw new IllegalArgumentException(
                    "Camera ID must not be blank"
            );
        }

        Camera camera = cameraRepository
                .findByCameraCode(cameraId.trim())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Camera not found: " + cameraId
                        )
                );

        List<Detection> detections =
                detectionRepository
                        .findByCameraIdOrderByDetectedAtDesc(
                                camera.getId()
                        );

        return detections.stream()
                .map(this::toDetectionResponse)
                .toList();
    }

    private DetectionResponse toDetectionResponse(
            Detection detection) {

        return new DetectionResponse(
                detection.getId(),
                detection.getEventId(),
                detection.getVehicle().getId(),
                detection.getPlateNumber(),
                detection.getCamera().getCameraCode(),
                detection.getDetectedAt(),
                detection.getVehicleType(),
                detection.getVehicleConfidence(),
                detection.getPlateConfidence(),
                detection.getSpeedKmh(),
                detection.getDirection()
        );
    }
}