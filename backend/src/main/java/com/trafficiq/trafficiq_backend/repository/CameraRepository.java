package com.trafficiq.trafficiq_backend.repository;
import com.trafficiq.trafficiq_backend.entity.Camera;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CameraRepository
        extends JpaRepository<Camera, String> {

}
