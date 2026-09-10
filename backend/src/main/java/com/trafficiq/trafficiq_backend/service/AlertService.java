package com.trafficiq.trafficiq_backend.service;

import com.trafficiq.trafficiq_backend.dto.response.AlertResponse;
import com.trafficiq.trafficiq_backend.entity.Alert;
import com.trafficiq.trafficiq_backend.entity.Detection;
import com.trafficiq.trafficiq_backend.enums.AlertStatus;
import com.trafficiq.trafficiq_backend.enums.AlertType;
import com.trafficiq.trafficiq_backend.enums.VehicleStatus;
import com.trafficiq.trafficiq_backend.repository.AlertRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AlertService {

    private static final double SPEED_LIMIT = 60.0;

    private final AlertRepository alertRepository;
    private final TrafficWebSocketService trafficWebSocketService;

    public AlertService(
            AlertRepository alertRepository,
            TrafficWebSocketService trafficWebSocketService
    ) {
        this.alertRepository = alertRepository;
        this.trafficWebSocketService = trafficWebSocketService;
    }

    public List<AlertResponse> checkAndCreateAlerts(
            Detection detection
    ) {
        List<AlertResponse> createdAlerts =
                new ArrayList<>();

        if (
                detection.getSpeedKmh() != null
                        && detection.getSpeedKmh() > SPEED_LIMIT
                        && !alertRepository.existsByDetectionAndType(
                        detection,
                        AlertType.SPEED_VIOLATION
                )
        ) {
            Alert alert = new Alert();

            alert.setType(AlertType.SPEED_VIOLATION);
            alert.setStatus(AlertStatus.ACTIVE);
            alert.setVehicle(detection.getVehicle());
            alert.setDetection(detection);
            alert.setSpeedKmh(detection.getSpeedKmh());
            alert.setSpeedLimit(SPEED_LIMIT);
            alert.setCreatedAt(LocalDateTime.now());

            Alert savedAlert =
                    alertRepository.save(alert);

            createdAlerts.add(
                    convertToResponse(savedAlert)
            );
        }

        if (
                detection.getVehicle() != null
                        && detection.getVehicle().getStatus()
                        == VehicleStatus.BLACKLISTED
                        && !alertRepository.existsByDetectionAndType(
                        detection,
                        AlertType.BLACKLISTED_VEHICLE
                )
        ) {
            Alert alert = new Alert();

            alert.setType(AlertType.BLACKLISTED_VEHICLE);
            alert.setStatus(AlertStatus.ACTIVE);
            alert.setVehicle(detection.getVehicle());
            alert.setDetection(detection);
            alert.setSpeedKmh(detection.getSpeedKmh());
            alert.setCreatedAt(LocalDateTime.now());

            Alert savedAlert =
                    alertRepository.save(alert);

            createdAlerts.add(
                    convertToResponse(savedAlert)
            );
        }

        return createdAlerts;
    }

    public List<AlertResponse> getRecentAlerts() {
        return alertRepository
                .findTop10ByOrderByCreatedAtDesc()
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public List<AlertResponse> getAlertsByStatus(
            AlertStatus status
    ) {
        return alertRepository
                .findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public List<AlertResponse> getAlertsByType(
            AlertType type
    ) {
        return alertRepository
                .findByTypeOrderByCreatedAtDesc(type)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public AlertResponse markAlertAsSeen(
            Long alertId
    ) {
        Alert alert =
                alertRepository.findById(alertId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Alert not found: " + alertId
                                )
                        );

        alert.setStatus(AlertStatus.SEEN);

        Alert savedAlert =
                alertRepository.save(alert);

        AlertResponse response =
                convertToResponse(savedAlert);

        trafficWebSocketService.broadcastAlertUpdate(
                response
        );

        trafficWebSocketService.broadcastDashboardUpdate();

        return response;
    }

    public AlertResponse resolveAlert(
            Long alertId
    ) {
        Alert alert =
                alertRepository.findById(alertId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Alert not found: " + alertId
                                )
                        );

        alert.setStatus(AlertStatus.RESOLVED);

        Alert savedAlert =
                alertRepository.save(alert);

        AlertResponse response =
                convertToResponse(savedAlert);

        trafficWebSocketService.broadcastAlertUpdate(
                response
        );

        trafficWebSocketService.broadcastDashboardUpdate();

        return response;
    }

    public AlertResponse convertToResponse(
            Alert alert
    ) {
        AlertResponse response = new AlertResponse();

        response.setId(alert.getId());
        response.setType(alert.getType());
        response.setStatus(alert.getStatus());

        if (alert.getVehicle() != null) {
            response.setPlateNumber(
                    alert.getVehicle().getPlateNumber()
            );

            response.setVehicleType(
                    alert.getVehicle()
                            .getVehicleType()
                            .name()
            );
        }

        if (alert.getDetection() != null) {
            response.setCameraId(
                    alert.getDetection()
                            .getCamera()
                            .getCameraId()
            );
        }

        response.setSpeedKmh(alert.getSpeedKmh());
        response.setSpeedLimit(alert.getSpeedLimit());
        response.setCreatedAt(alert.getCreatedAt());

        return response;
    }
}