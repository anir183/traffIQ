package com.trafficiq.trafficiq_backend.repository;

import com.trafficiq.trafficiq_backend.entity.Alert;
import com.trafficiq.trafficiq_backend.entity.Detection;
import com.trafficiq.trafficiq_backend.enums.AlertStatus;
import com.trafficiq.trafficiq_backend.enums.AlertType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findTop10ByOrderByCreatedAtDesc();

    List<Alert> findByStatusOrderByCreatedAtDesc(
            AlertStatus status
    );

    List<Alert> findByTypeOrderByCreatedAtDesc(
            AlertType type
    );

    boolean existsByDetectionAndType(
            Detection detection,
            AlertType type
    );

    long countByStatus(AlertStatus status);
}