package com.trafficiq.dto.response;

import java.time.Instant;

public class AlertResponse {

    private Long alertId;
    private Long vehicleId;
    private String plateNumber;
    private String alertType;
    private String message;
    private Instant time;

    public AlertResponse() {
    }

    public AlertResponse(
            Long alertId,
            Long vehicleId,
            String plateNumber,
            String alertType,
            String message,
            Instant time) {

        this.alertId = alertId;
        this.vehicleId = vehicleId;
        this.plateNumber = plateNumber;
        this.alertType = alertType;
        this.message = message;
        this.time = time;
    }

    public Long getAlertId() {
        return alertId;
    }

    public void setAlertId(Long alertId) {
        this.alertId = alertId;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getPlateNumber() {
        return plateNumber;
    }

    public void setPlateNumber(String plateNumber) {
        this.plateNumber = plateNumber;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Instant getTime() {
        return time;
    }

    public void setTime(Instant time) {
        this.time = time;
    }
}