package com.trafficiq.service;

import com.trafficiq.dto.response.TrajectoryPoint;
import com.trafficiq.dto.response.VehicleResponse;
import com.trafficiq.entity.Detection;
import com.trafficiq.entity.Vehicle;
import com.trafficiq.repository.DetectionRepository;
import com.trafficiq.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final DetectionRepository detectionRepository;

    public VehicleService(
            VehicleRepository vehicleRepository,
            DetectionRepository detectionRepository) {

        this.vehicleRepository = vehicleRepository;
        this.detectionRepository = detectionRepository;
    }

    @Transactional(readOnly = true)
    public VehicleResponse findByPlateNumber(
            String plateNumber) {

        String normalizedPlate =
                normalizePlate(plateNumber);

        if (normalizedPlate.isBlank()) {
            throw new IllegalArgumentException(
                    "Plate number must not be blank"
            );
        }

        Vehicle vehicle =
                vehicleRepository
                        .findByPlateNumber(normalizedPlate)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Vehicle not found: "
                                                + normalizedPlate
                                )
                        );

        return toVehicleResponse(vehicle);
    }

    @Transactional(readOnly = true)
    public List<TrajectoryPoint> getTrajectory(
            Long vehicleId) {

        if (vehicleId == null || vehicleId <= 0) {
            throw new IllegalArgumentException(
                    "Vehicle ID must be greater than 0"
            );
        }

        if (!vehicleRepository.existsById(vehicleId)) {
            throw new IllegalArgumentException(
                    "Vehicle not found: " + vehicleId
            );
        }

        List<Detection> detections =
                detectionRepository
                        .findByVehicleIdOrderByDetectedAtAsc(
                                vehicleId
                        );

        return detections.stream()
                .map(this::toTrajectoryPoint)
                .toList();
    }

    private VehicleResponse toVehicleResponse(
            Vehicle vehicle) {

        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getPlateNumber(),
                vehicle.getVehicleType(),
                vehicle.getFirstSeen(),
                vehicle.getLastSeen(),
                vehicle.getTotalDetections()
        );
    }

    private TrajectoryPoint toTrajectoryPoint(
            Detection detection) {

        return new TrajectoryPoint(
                detection.getDetectedAt(),
                detection.getCamera().getCameraCode(),
                detection.getCamera().getLatitude(),
                detection.getCamera().getLongitude(),
                detection.getSpeedKmh(),
                detection.getPlateConfidence()
        );
    }

    private String normalizePlate(String plate) {

        if (plate == null) {
            return "";
        }

        return plate
                .trim()
                .toUpperCase()
                .replaceAll("\\s+", "");
    }
}