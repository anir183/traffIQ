package com.trafficiq.repository;

import com.trafficiq.entity.Camera;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CameraRepository extends JpaRepository<Camera, Long> {

    Optional<Camera> findByCameraCode(String cameraCode);

    List<Camera> findBySequenceOrderLessThanOrderBySequenceOrderDesc(
            Integer sequenceOrder
    );
}