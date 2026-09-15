package com.trafficiq.dto.response;

public class MlIngestResponse {

    private String message;
    private Long vehicleId;
    private Long detectionId;
    private String plateNumber;
    private boolean newVehicle;

    public MlIngestResponse() {
    }

    public MlIngestResponse(
            String message,
            Long vehicleId,
            Long detectionId,
            String plateNumber,
            boolean newVehicle) {

        this.message = message;
        this.vehicleId = vehicleId;
        this.detectionId = detectionId;
        this.plateNumber = plateNumber;
        this.newVehicle = newVehicle;
    }

    public String getMessage() {
        return message;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public Long getDetectionId() {
        return detectionId;
    }

    public String getPlateNumber() {
        return plateNumber;
    }

    public boolean isNewVehicle() {
        return newVehicle;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setVehicleId(Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public void setDetectionId(Long detectionId) {
        this.detectionId = detectionId;
    }

    public void setPlateNumber(String plateNumber) {
        this.plateNumber = plateNumber;
    }

    public void setNewVehicle(boolean newVehicle) {
        this.newVehicle = newVehicle;
    }
}