package com.trafficiq.trafficiq_backend.repository;

import com.trafficiq.trafficiq_backend.entity.Detection;
import com.trafficiq.trafficiq_backend.enums.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface DetectionRepository extends JpaRepository<Detection, Long> {

    Optional<Detection> findByEventId(String eventId);

    List<Detection> findTop50ByOrderByDetectedAtDesc();

    List<Detection> findByVehiclePlateNumberOrderByDetectedAtDesc(
            String plateNumber
    );

    List<Detection> findByCameraCameraIdOrderByDetectedAtDesc(
            String cameraId
    );

    long countByDetectedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );

    long countByVehicleVehicleTypeAndDetectedAtBetween(
            VehicleType vehicleType,
            LocalDateTime start,
            LocalDateTime end
    );
}