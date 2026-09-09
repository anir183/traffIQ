package com.trafficiq.trafficiq_backend.service;

import com.trafficiq.trafficiq_backend.dto.response.AlertResponse;
import com.trafficiq.trafficiq_backend.entity.Alert;
import com.trafficiq.trafficiq_backend.entity.Detection;
import com.trafficiq.trafficiq_backend.entity.Vehicle;
import com.trafficiq.trafficiq_backend.enums.AlertStatus;
import com.trafficiq.trafficiq_backend.enums.AlertType;
import com.trafficiq.trafficiq_backend.enums.VehicleStatus;
import com.trafficiq.trafficiq_backend.repository.AlertRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AlertService {

    private static final double SPEED_LIMIT = 60.0;

    private final AlertRepository alertRepository;

    public AlertService(
            AlertRepository alertRepository
    ) {
        this.alertRepository = alertRepository;
    }

    public void checkAndCreateAlerts(
            Detection detection
    ) {

        checkSpeedViolation(
                detection
        );

        checkBlacklistedVehicle(
                detection
        );
    }

    private void checkSpeedViolation(
            Detection detection
    ) {

        Double speed =
                detection.getSpeedKmh();

        if (speed == null) {
            return;
        }

        if (speed <= SPEED_LIMIT) {
            return;
        }

        boolean alertExists =
                alertRepository
                        .existsByDetectionAndType(
                                detection,
                                AlertType.SPEED_VIOLATION
                        );

        if (alertExists) {
            return;
        }

        Alert alert =
                new Alert();

        alert.setType(
                AlertType.SPEED_VIOLATION
        );

        alert.setStatus(
                AlertStatus.ACTIVE
        );

        alert.setVehicle(
                detection.getVehicle()
        );

        alert.setDetection(
                detection
        );

        alert.setSpeedKmh(
                speed
        );

        alert.setSpeedLimit(
                SPEED_LIMIT
        );

        alert.setCreatedAt(
                LocalDateTime.now()
        );

        alertRepository.save(
                alert
        );
    }

    private void checkBlacklistedVehicle(
            Detection detection
    ) {

        Vehicle vehicle =
                detection.getVehicle();

        if (vehicle == null) {
            return;
        }

        if (vehicle.getStatus()
                != VehicleStatus.BLACKLISTED) {
            return;
        }

        boolean alertExists =
                alertRepository
                        .existsByDetectionAndType(
                                detection,
                                AlertType.BLACKLISTED_VEHICLE
                        );

        if (alertExists) {
            return;
        }

        Alert alert =
                new Alert();

        alert.setType(
                AlertType.BLACKLISTED_VEHICLE
        );

        alert.setStatus(
                AlertStatus.ACTIVE
        );

        alert.setVehicle(
                vehicle
        );

        alert.setDetection(
                detection
        );

        alert.setSpeedKmh(
                detection.getSpeedKmh()
        );

        alert.setCreatedAt(
                LocalDateTime.now()
        );

        alertRepository.save(
                alert
        );
    }

    public List<AlertResponse> getRecentAlerts() {

        return alertRepository
                .findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(
                        this::convertToResponse
                )
                .toList();
    }

    public List<AlertResponse> getAlertsByStatus(
            AlertStatus status
    ) {

        return alertRepository
                .findByStatusOrderByCreatedAtDesc(
                        status
                )
                .stream()
                .map(
                        this::convertToResponse
                )
                .toList();
    }

    public List<AlertResponse> getAlertsByType(
            AlertType type
    ) {

        return alertRepository
                .findByTypeOrderByCreatedAtDesc(
                        type
                )
                .stream()
                .map(
                        this::convertToResponse
                )
                .toList();
    }

    public AlertResponse markAlertAsSeen(
            Long alertId
    ) {

        Alert alert =
                alertRepository
                        .findById(
                                alertId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Alert not found: "
                                                + alertId
                                )
                        );

        alert.setStatus(
                AlertStatus.SEEN
        );

        Alert savedAlert =
                alertRepository.save(
                        alert
                );

        return convertToResponse(
                savedAlert
        );
    }

    public AlertResponse resolveAlert(
            Long alertId
    ) {

        Alert alert =
                alertRepository
                        .findById(
                                alertId
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Alert not found: "
                                                + alertId
                                )
                        );

        alert.setStatus(
                AlertStatus.RESOLVED
        );

        Alert savedAlert =
                alertRepository.save(
                        alert
                );

        return convertToResponse(
                savedAlert
        );
    }

    private AlertResponse convertToResponse(
            Alert alert
    ) {

        AlertResponse response =
                new AlertResponse();

        response.setId(
                alert.getId()
        );

        response.setType(
                alert.getType()
        );

        response.setStatus(
                alert.getStatus()
        );

        if (alert.getVehicle() != null) {

            response.setPlateNumber(
                    alert.getVehicle()
                            .getPlateNumber()
            );

            if (alert.getVehicle()
                    .getVehicleType() != null) {

                response.setVehicleType(
                        alert.getVehicle()
                                .getVehicleType()
                                .name()
                );
            }
        }

        if (alert.getDetection() != null
                && alert.getDetection()
                .getCamera() != null) {

            response.setCameraId(
                    alert.getDetection()
                            .getCamera()
                            .getCameraId()
            );
        }

        response.setSpeedKmh(
                alert.getSpeedKmh()
        );

        response.setSpeedLimit(
                alert.getSpeedLimit()
        );

        response.setCreatedAt(
                alert.getCreatedAt()
        );

        return response;
    }
}