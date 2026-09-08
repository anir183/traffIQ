package com.trafficiq.trafficiq_backend.entity;


import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "cameras")
public class Camera {

    @Id
    private String cameraId;

    private boolean active = true;

    public Camera() {
    }

    public Camera(String cameraId) {
        this.cameraId = cameraId;
        this.active = true;
    }

    public String getCameraId() {
        return cameraId;
    }

    public void setCameraId(String cameraId) {
        this.cameraId = cameraId;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}