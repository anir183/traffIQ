package com.trafficiq.trafficiq_backend.service;

import com.trafficiq.trafficiq_backend.dto.response.AlertResponse;
import com.trafficiq.trafficiq_backend.dto.response.DashboardResponse;
import com.trafficiq.trafficiq_backend.dto.response.VehicleTypeCountResponse;
import com.trafficiq.trafficiq_backend.entity.Vehicle;
import com.trafficiq.trafficiq_backend.enums.VehicleType;
import com.trafficiq.trafficiq_backend.repository.AlertRepository;
import com.trafficiq.trafficiq_backend.repository.CameraRepository;
import com.trafficiq.trafficiq_backend.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class DashboardService {

    private static final long LIVE_VEHICLE_WINDOW_SECONDS = 30;

    private final VehicleRepository vehicleRepository;
    private final CameraRepository cameraRepository;
    private final AlertRepository alertRepository;

    public DashboardService(
            VehicleRepository vehicleRepository,
            CameraRepository cameraRepository,
            AlertRepository alertRepository
    ) {
        this.vehicleRepository = vehicleRepository;
        this.cameraRepository = cameraRepository;
        this.alertRepository = alertRepository;
    }

    public DashboardResponse getDashboardData() {

        LocalDateTime liveThreshold =
                LocalDateTime.now()
                        .minusSeconds(
                                LIVE_VEHICLE_WINDOW_SECONDS
                        );

        List<Vehicle> vehicles =
                vehicleRepository.findAll();

        long totalVehicles =
                vehicles.stream()
                        .filter(vehicle ->
                                vehicle.getLastSeen() != null
                                        && !vehicle.getLastSeen()
                                        .isBefore(liveThreshold)
                        )
                        .count();

        long uniqueVehicles =
                vehicleRepository.count();

        long activeCameras =
                cameraRepository.findAll()
                        .stream()
                        .filter(camera -> camera.isActive())
                        .count();

        long activeAlerts =
                alertRepository.countByStatus(
                        com.trafficiq.trafficiq_backend.enums.AlertStatus.ACTIVE
                );

        List<VehicleTypeCountResponse> vehicleTypeBreakdown =
                Arrays.stream(VehicleType.values())
                        .map(type -> {
                            long count =
                                    vehicles.stream()
                                            .filter(vehicle ->
                                                    vehicle.getVehicleType()
                                                            == type
                                            )
                                            .count();

                            VehicleTypeCountResponse response =
                                    new VehicleTypeCountResponse();

                            response.setVehicleType(type.name());
                            response.setCount(count);

                            return response;
                        })
                        .toList();

        List<AlertResponse> recentAlerts =
                alertRepository
                        .findTop10ByOrderByCreatedAtDesc()
                        .stream()
                        .map(this::convertAlertToResponse)
                        .toList();

        DashboardResponse response =
                new DashboardResponse();

        response.setTotalVehicles(totalVehicles);
        response.setUniqueVehicles(uniqueVehicles);
        response.setActiveCameras(activeCameras);
        response.setActiveAlerts(activeAlerts);
        response.setVehicleTypeBreakdown(
                vehicleTypeBreakdown
        );
        response.setRecentAlerts(recentAlerts);

        return response;
    }

    private AlertResponse convertAlertToResponse(
            com.trafficiq.trafficiq_backend.entity.Alert alert
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