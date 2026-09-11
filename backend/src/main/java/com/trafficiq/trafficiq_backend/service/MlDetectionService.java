package com.trafficiq.trafficiq_backend.service;

import com.trafficiq.trafficiq_backend.dto.input.MlDetectionRequest;
import com.trafficiq.trafficiq_backend.dto.response.AlertResponse;
import com.trafficiq.trafficiq_backend.dto.response.DetectionResponse;
import com.trafficiq.trafficiq_backend.dto.response.MlIngestResponse;
import com.trafficiq.trafficiq_backend.entity.Camera;
import com.trafficiq.trafficiq_backend.entity.Detection;
import com.trafficiq.trafficiq_backend.entity.Vehicle;
import com.trafficiq.trafficiq_backend.enums.VehicleType;
import com.trafficiq.trafficiq_backend.repository.CameraRepository;
import com.trafficiq.trafficiq_backend.repository.DetectionRepository;
import com.trafficiq.trafficiq_backend.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

@Service
public class MlDetectionService {

    private final DetectionRepository detectionRepository;
    private final VehicleRepository vehicleRepository;
    private final CameraRepository cameraRepository;
    private final AlertService alertService;
    private final DetectionService detectionService;
    private final TrafficWebSocketService trafficWebSocketService;

    public MlDetectionService(
            DetectionRepository detectionRepository,
            VehicleRepository vehicleRepository,
            CameraRepository cameraRepository,
            AlertService alertService,
            DetectionService detectionService,
            TrafficWebSocketService trafficWebSocketService
    ) {
        this.detectionRepository = detectionRepository;
        this.vehicleRepository = vehicleRepository;
        this.cameraRepository = cameraRepository;
        this.alertService = alertService;
        this.detectionService = detectionService;
        this.trafficWebSocketService = trafficWebSocketService;
    }

    public MlIngestResponse processDetection(
            MlDetectionRequest request
    ) {

        LocalDateTime detectionTime =
                convertTimestamp(
                        request.getTimestamp()
                );

        Detection existingDetection =
                detectionRepository
                        .findByEventId(
                                request.getEventId()
                        )
                        .orElse(null);


        // =========================================
        // EXISTING DETECTION
        // =========================================

        if (existingDetection != null) {

            existingDetection.setLastSeen(
                    detectionTime
            );

            if (request.getSpeed() != null) {

                existingDetection.setSpeedKmh(
                        request.getSpeed()
                                .getValueKmh()
                );

                existingDetection.setDirection(
                        request.getSpeed()
                                .getDirection()
                );
            }

            existingDetection.setVehicleConfidence(
                    request.getVehicle()
                            .getTypeConfidence()
            );

            existingDetection.setPlateConfidence(
                    request.getPlate()
                            .getConfidence()
            );


            Detection savedDetection =
                    detectionRepository.save(
                            existingDetection
                    );


            Vehicle vehicle =
                    savedDetection.getVehicle();

            if (vehicle != null) {

                vehicle.setLastSeen(
                        detectionTime
                );

                vehicleRepository.save(
                        vehicle
                );
            }


            List<AlertResponse> createdAlerts =
                    alertService.checkAndCreateAlerts(
                            savedDetection
                    );


            broadcastLiveUpdates(
                    savedDetection,
                    createdAlerts
            );


            return new MlIngestResponse(
                    true,
                    "Existing detection updated successfully",
                    savedDetection.getEventId()
            );
        }


        // =========================================
        // NEW CAMERA
        // =========================================

        Camera camera =
                cameraRepository
                        .findById(
                                request.getCameraId()
                        )
                        .orElseGet(() -> {

                            Camera newCamera =
                                    new Camera(
                                            request.getCameraId()
                                    );

                            return cameraRepository.save(
                                    newCamera
                            );
                        });


        // =========================================
        // VEHICLE
        // =========================================

        String plateNumber =
                request.getPlate()
                        .getText()
                        .trim()
                        .toUpperCase(
                                Locale.ROOT
                        );


        Vehicle vehicle =
                vehicleRepository
                        .findByPlateNumber(
                                plateNumber
                        )
                        .orElseGet(() -> {

                            Vehicle newVehicle =
                                    new Vehicle();

                            newVehicle.setPlateNumber(
                                    plateNumber
                            );

                            newVehicle.setVehicleType(
                                    convertVehicleType(
                                            request.getVehicle()
                                                    .getType()
                                    )
                            );

                            newVehicle.setFirstSeen(
                                    detectionTime
                            );

                            newVehicle.setLastSeen(
                                    detectionTime
                            );

                            return vehicleRepository.save(
                                    newVehicle
                            );
                        });


        vehicle.setLastSeen(
                detectionTime
        );

        vehicleRepository.save(
                vehicle
        );


        // =========================================
        // NEW DETECTION
        // =========================================

        Detection detection =
                new Detection();


        detection.setEventId(
                request.getEventId()
        );

        detection.setLocalTrackId(
                request.getLocalTrackId()
        );

        detection.setDetectedAt(
                detectionTime
        );

        detection.setFirstSeen(
                detectionTime
        );

        detection.setLastSeen(
                detectionTime
        );


        if (request.getSpeed() != null) {

            detection.setSpeedKmh(
                    request.getSpeed()
                            .getValueKmh()
            );

            detection.setDirection(
                    request.getSpeed()
                            .getDirection()
            );
        }


        detection.setVehicleConfidence(
                request.getVehicle()
                        .getTypeConfidence()
        );

        detection.setPlateConfidence(
                request.getPlate()
                        .getConfidence()
        );


        detection.setVehicle(
                vehicle
        );

        detection.setCamera(
                camera
        );


        Detection savedDetection =
                detectionRepository.save(
                        detection
                );


        List<AlertResponse> createdAlerts =
                alertService.checkAndCreateAlerts(
                        savedDetection
                );


        // SEND EXACT CURRENT DETECTION
        broadcastLiveUpdates(
                savedDetection,
                createdAlerts
        );


        return new MlIngestResponse(
                true,
                "New detection created successfully",
                savedDetection.getEventId()
        );
    }


    // =========================================
    // LIVE WEBSOCKET UPDATES
    // =========================================

    private void broadcastLiveUpdates(
            Detection detection,
            List<AlertResponse> createdAlerts
    ) {

        DetectionResponse detectionResponse =
                detectionService.convertToResponse(
                        detection
                );


        // STORE EXACT CURRENT LIVE DETECTION
        detectionService.setLiveDetection(
                detectionResponse
        );


        // SEND EXACT CURRENT DETECTION
        trafficWebSocketService
                .broadcastDetectionUpdate(
                        detectionResponse
                );


        // SEND NEW ALERTS
        for (AlertResponse alert : createdAlerts) {

            trafficWebSocketService
                    .broadcastAlertUpdate(
                            alert
                    );
        }


        // UPDATE DASHBOARD
        trafficWebSocketService
                .broadcastDashboardUpdate();
    }


    private LocalDateTime convertTimestamp(
            String timestamp
    ) {

        return Instant.parse(
                        timestamp
                )
                .atZone(
                        ZoneId.systemDefault()
                )
                .toLocalDateTime();
    }


    private VehicleType convertVehicleType(
            String type
    ) {

        if (type == null) {
            return VehicleType.OTHER;
        }

        try {

            return VehicleType.valueOf(
                    type.trim()
                            .toUpperCase(
                                    Locale.ROOT
                            )
            );

        } catch (IllegalArgumentException exception) {

            return VehicleType.OTHER;
        }
    }
}