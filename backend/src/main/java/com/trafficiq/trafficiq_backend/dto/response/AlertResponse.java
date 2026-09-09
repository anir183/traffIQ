package com.trafficiq.trafficiq_backend.dto.response;

import com.trafficiq.trafficiq_backend.enums.AlertStatus;
import com.trafficiq.trafficiq_backend.enums.AlertType;

import java.time.LocalDateTime;

public class AlertResponse {

    private Long id;

    private AlertType type;

    private AlertStatus status;

    private String plateNumber;

    private String vehicleType;

    private String cameraId;

    private Double speedKmh;

    private Double speedLimit;

    private LocalDateTime createdAt;

    public AlertResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(
            Long id
    ) {
        this.id = id;
    }

    public AlertType getType() {
        return type;
    }

    public void setType(
            AlertType type
    ) {
        this.type = type;
    }

    public AlertStatus getStatus() {
        return status;
    }

    public void setStatus(
            AlertStatus status
    ) {
        this.status = status;
    }

    public String getPlateNumber() {
        return plateNumber;
    }

    public void setPlateNumber(
            String plateNumber
    ) {
        this.plateNumber = plateNumber;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(
            String vehicleType
    ) {
        this.vehicleType = vehicleType;
    }

    public String getCameraId() {
        return cameraId;
    }

    public void setCameraId(
            String cameraId
    ) {
        this.cameraId = cameraId;
    }

    public Double getSpeedKmh() {
        return speedKmh;
    }

    public void setSpeedKmh(
            Double speedKmh
    ) {
        this.speedKmh = speedKmh;
    }

    public Double getSpeedLimit() {
        return speedLimit;
    }

    public void setSpeedLimit(
            Double speedLimit
    ) {
        this.speedLimit = speedLimit;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(
            LocalDateTime createdAt
    ) {
        this.createdAt = createdAt;
    }
}
