package com.trafficiq.dto.response;

import com.trafficiq.enums.Direction;
import com.trafficiq.enums.VehicleType;

import java.time.Instant;

public class DetectionResponse {

    private Long detectionId;
    private String eventId;
    private Long vehicleId;
    private String plateNumber;
    private String camera;
    private Instant detectedAt;
    private VehicleType vehicleType;
    private Double vehicleConfidence;
    private Double plateConfidence;
    private Double speedKmh;
    private Direction direction;

    public DetectionResponse() {
    }

    public DetectionResponse(
            Long detectionId,
            String eventId,
            Long vehicleId,
            String plateNumber,
            String camera,
            Instant detectedAt,
            VehicleType vehicleType,
            Double vehicleConfidence,
            Double plateConfidence,
            Double speedKmh,
            Direction direction) {

        this.detectionId = detectionId;
        this.eventId = eventId;
        this.vehicleId = vehicleId;
        this.plateNumber = plateNumber;
        this.camera = camera;
        this.detectedAt = detectedAt;
        this.vehicleType = vehicleType;
        this.vehicleConfidence = vehicleConfidence;
        this.plateConfidence = plateConfidence;
        this.speedKmh = speedKmh;
        this.direction = direction;
    }

    public Long getDetectionId() {
        return detectionId;
    }

    public void setDetectionId(Long detectionId) {
        this.detectionId = detectionId;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
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

    public String getCamera() {
        return camera;
    }

    public void setCamera(String camera) {
        this.camera = camera;
    }

    public Instant getDetectedAt() {
        return detectedAt;
    }

    public void setDetectedAt(Instant detectedAt) {
        this.detectedAt = detectedAt;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public Double getVehicleConfidence() {
        return vehicleConfidence;
    }

    public void setVehicleConfidence(Double vehicleConfidence) {
        this.vehicleConfidence = vehicleConfidence;
    }

    public Double getPlateConfidence() {
        return plateConfidence;
    }

    public void setPlateConfidence(Double plateConfidence) {
        this.plateConfidence = plateConfidence;
    }

    public Double getSpeedKmh() {
        return speedKmh;
    }

    public void setSpeedKmh(Double speedKmh) {
        this.speedKmh = speedKmh;
    }

    public Direction getDirection() {
        return direction;
    }

    public void setDirection(Direction direction) {
        this.direction = direction;
    }
}