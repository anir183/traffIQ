package com.trafficiq.repository;

import com.trafficiq.entity.Detection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface DetectionRepository extends JpaRepository<Detection, Long> {

    Optional<Detection> findByEventId(String eventId);

    List<Detection> findByVehicleIdOrderByDetectedAtAsc(Long vehicleId);

    List<Detection> findByCameraIdOrderByDetectedAtDesc(Long cameraId);

    List<Detection> findByPlateNumberOrderByDetectedAtDesc(
            String plateNumber
    );

    @Query("""
            SELECT d
            FROM Detection d
            JOIN d.camera c
            WHERE d.plateNumber = :plateNumber
              AND c.sequenceOrder < :currentSequence
              AND d.detectedAt >= :fromTime
              AND d.detectedAt <= :toTime
            ORDER BY c.sequenceOrder DESC, d.detectedAt DESC
            """)
    List<Detection> findPreviousCameraDetections(
            @Param("plateNumber") String plateNumber,
            @Param("currentSequence") Integer currentSequence,
            @Param("fromTime") Instant fromTime,
            @Param("toTime") Instant toTime
    );
}