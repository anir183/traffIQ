package com.trafficiq.service;

import com.trafficiq.dto.input.MlDetectionRequest;
import com.trafficiq.dto.response.MlIngestResponse;
import com.trafficiq.entity.Camera;
import com.trafficiq.entity.Detection;
import com.trafficiq.entity.Vehicle;
import com.trafficiq.enums.Direction;
import com.trafficiq.enums.VehicleType;
import com.trafficiq.matcher.VehicleMatchingService;
import com.trafficiq.repository.CameraRepository;
import com.trafficiq.repository.DetectionRepository;
import com.trafficiq.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class MlDetectionService {

    private final CameraRepository cameraRepository;
    private final VehicleRepository vehicleRepository;
    private final DetectionRepository detectionRepository;
    private final VehicleMatchingService vehicleMatchingService;

    public MlDetectionService(
            CameraRepository cameraRepository,
            VehicleRepository vehicleRepository,
            DetectionRepository detectionRepository,
            VehicleMatchingService vehicleMatchingService) {

        this.cameraRepository = cameraRepository;
        this.vehicleRepository = vehicleRepository;
        this.detectionRepository = detectionRepository;
        this.vehicleMatchingService = vehicleMatchingService;
    }

    @Transactional
    public MlIngestResponse ingestDetection(
            MlDetectionRequest request) {

        if (detectionRepository
                .findByEventId(request.getEventId())
                .isPresent()) {

            throw new IllegalArgumentException(
                    "Detection event already processed: "
                            + request.getEventId()
            );
        }


        Camera camera = cameraRepository
                .findByCameraCode(request.getCameraId())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Camera not found: "
                                        + request.getCameraId()
                        )
                );

        Instant detectedAt;

        try {

            detectedAt =
                    Instant.parse(request.getTimestamp());

        } catch (Exception exception) {

            throw new IllegalArgumentException(
                    "Invalid timestamp: "
                            + request.getTimestamp()
            );
        }


        VehicleMatchingService.MatchResult matchResult =
                vehicleMatchingService.findVehicle(
                        request,
                        camera
                );


        if (matchResult.getVehicle() == null) {

            throw new IllegalArgumentException(
                    "No valid plate candidate available "
                            + "for vehicle matching"
            );
        }

        Vehicle vehicle =
                matchResult.getVehicle();

        if (matchResult.isNewVehicle()) {

            vehicle.setFirstSeen(detectedAt);

            vehicle.setLastSeen(detectedAt);

            vehicle.setTotalDetections(1);

            vehicle.setCreatedAt(
                    Instant.now()
            );

            vehicle = vehicleRepository.save(vehicle);

        } else {

            vehicle.setLastSeen(detectedAt);

            Integer currentCount =
                    vehicle.getTotalDetections();

            if (currentCount == null) {
                currentCount = 0;
            }

            vehicle.setTotalDetections(
                    currentCount + 1
            );

            if (vehicle.getVehicleType()
                    == VehicleType.UNKNOWN) {

                vehicle.setVehicleType(
                        convertVehicleType(
                                request.getVehicle().getType()
                        )
                );
            }

            vehicleRepository.save(vehicle);
        }


        Detection detection = new Detection();

        detection.setEventId(
                request.getEventId()
        );

        detection.setVehicle(vehicle);

        detection.setCamera(camera);

        detection.setEventType(
                request.getEventType()
        );

        detection.setDetectedAt(
                detectedAt
        );

        if (matchResult.getMatchedCandidate() != null) {

            detection.setPlateNumber(
                    normalizePlate(
                            matchResult
                                    .getMatchedCandidate()
                                    .getData()
                    )
            );

            detection.setPlateConfidence(
                    matchResult
                            .getMatchedCandidate()
                            .getConfidence()
            );
        }

        /*
         * Vehicle information from ML.
         */
        detection.setVehicleType(
                convertVehicleType(
                        request.getVehicle().getType()
                )
        );

        detection.setVehicleConfidence(
                request.getVehicle()
                        .getTypeConfidence()
        );

        /*
         * Speed information.
         */
        if (request.getSpeed() != null) {

            detection.setSpeedKmh(
                    request.getSpeed()
                            .getValueKmh()
            );

            detection.setDirection(
                    convertDirection(
                            request.getSpeed()
                                    .getDirection()
                    )
            );
        }

        detection.setLocalTrackId(
                request.getLocalTrackId()
        );

        detection.setCreatedAt(
                Instant.now()
        );

        detection =
                detectionRepository.save(detection);

        return new MlIngestResponse(
                "Detection ingested successfully",
                vehicle.getId(),
                detection.getId(),
                detection.getPlateNumber(),
                matchResult.isNewVehicle()
        );
    }

    private String normalizePlate(String plate) {

        if (plate == null) {
            return null;
        }

        return plate
                .trim()
                .toUpperCase()
                .replaceAll("\\s+", "");
    }

    private VehicleType convertVehicleType(
            String type) {

        if (type == null || type.isBlank()) {
            return VehicleType.UNKNOWN;
        }

        try {

            return VehicleType.valueOf(
                    type.trim().toUpperCase()
            );

        } catch (IllegalArgumentException exception) {

            return VehicleType.UNKNOWN;
        }
    }

    private Direction convertDirection(
            String direction) {

        if (direction == null
                || direction.isBlank()) {

            return Direction.UNKNOWN;
        }

        try {

            return Direction.valueOf(
                    direction.trim().toUpperCase()
            );

        } catch (IllegalArgumentException exception) {

            return Direction.UNKNOWN;
        }
    }
}