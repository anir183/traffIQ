package com.trafficiq.trafficiq_backend.repository;


import com.trafficiq.trafficiq_backend.entity.Detection;
import com.trafficiq.trafficiq_backend.enums.VehicleType;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface DetectionRepository
        extends JpaRepository<Detection, Long> {
    //live detection show table
    List<Detection> findTop50ByOrderByDetectedAtDesc();

    //search engine
    List<Detection> findByVehiclePlateNumberOrderByDetectedAtDesc(
            String plateNumber
    );
    boolean existsByEventId(String eventId);
   //search by camare
    List<Detection> findByCameraCameraIdOrderByDetectedAtDesc(
            String cameraId
    );

    //count total in between start and end
    long countByDetectedAtBetween(
            LocalDateTime start,
            LocalDateTime end
    );

    //count total in between
    long countByVehicleTypeAndDetectedAtBetween(
            VehicleType vehicleType,
            LocalDateTime start,
            LocalDateTime end
    );
}
