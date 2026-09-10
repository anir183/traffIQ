package com.trafficiq.trafficiq_backend.service;

import com.trafficiq.trafficiq_backend.dto.response.DetectionResponse;
import com.trafficiq.trafficiq_backend.entity.Detection;
import com.trafficiq.trafficiq_backend.repository.DetectionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DetectionService {

    private final DetectionRepository detectionRepository;

    public DetectionService(DetectionRepository detectionRepository) {
        this.detectionRepository = detectionRepository;
    }

    public List<DetectionResponse> getRecentDetections() {
        return detectionRepository
                .findTop50ByOrderByDetectedAtDesc()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public List<DetectionResponse> getDetectionsByVehicle(
            String plateNumber
    ) {
        return detectionRepository
                .findByVehiclePlateNumberOrderByDetectedAtDesc(
                        plateNumber.trim().toUpperCase()
                )
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public List<DetectionResponse> getDetectionsByCamera(
            String cameraId
    ) {
        return detectionRepository
                .findByCameraCameraIdOrderByDetectedAtDesc(cameraId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public DetectionResponse convertToResponse(
            Detection detection
    ) {
        DetectionResponse response = new DetectionResponse();

        response.setId(detection.getId());
        response.setEventId(detection.getEventId());
        response.setLocalTrackId(detection.getLocalTrackId());
        response.setPlateNumber(
                detection.getVehicle().getPlateNumber()
        );
        response.setVehicleType(
                detection.getVehicle()
                        .getVehicleType()
                        .name()
        );
        response.setCameraId(
                detection.getCamera().getCameraId()
        );
        response.setDetectedAt(detection.getDetectedAt());
        response.setFirstSeen(detection.getFirstSeen());
        response.setLastSeen(detection.getLastSeen());
        response.setSpeedKmh(detection.getSpeedKmh());
        response.setDirection(detection.getDirection());
        response.setVehicleConfidence(
                detection.getVehicleConfidence()
        );
        response.setPlateConfidence(
                detection.getPlateConfidence()
        );

        return response;
    }
}