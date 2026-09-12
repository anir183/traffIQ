package com.trafficiq.trafficiq_backend.dto.response;

import java.time.LocalDateTime;

public class DetectionResponse {

    private Long id;

    private String eventId;

    private Integer localTrackId;

    private String plateNumber;

    private String vehicleType;

    private String cameraId;

    private LocalDateTime detectedAt;

    private LocalDateTime firstSeen;

    private LocalDateTime lastSeen;

    private Double speedKmh;

    private String direction;

    private Double vehicleConfidence;

    private Double plateConfidence;


    public DetectionResponse() {
    }


    public Long getId() {
        return id;
    }

    public void setId(
            Long id
    ) {
        this.id = id;
    }


    public String getEventId() {
        return eventId;
    }

    public void setEventId(
            String eventId
    ) {
        this.eventId = eventId;
    }


    public Integer getLocalTrackId() {
        return localTrackId;
    }

    public void setLocalTrackId(
            Integer localTrackId
    ) {
        this.localTrackId = localTrackId;
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


    public LocalDateTime getDetectedAt() {
        return detectedAt;
    }

    public void setDetectedAt(
            LocalDateTime detectedAt
    ) {
        this.detectedAt = detectedAt;
    }


    public LocalDateTime getFirstSeen() {
        return firstSeen;
    }

    public void setFirstSeen(
            LocalDateTime firstSeen
    ) {
        this.firstSeen = firstSeen;
    }


    public LocalDateTime getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(
            LocalDateTime lastSeen
    ) {
        this.lastSeen = lastSeen;
    }


    public Double getSpeedKmh() {
        return speedKmh;
    }

    public void setSpeedKmh(
            Double speedKmh
    ) {
        this.speedKmh = speedKmh;
    }


    public String getDirection() {
        return direction;
    }

    public void setDirection(
            String direction
    ) {
        this.direction = direction;
    }


    public Double getVehicleConfidence() {
        return vehicleConfidence;
    }

    public void setVehicleConfidence(
            Double vehicleConfidence
    ) {
        this.vehicleConfidence = vehicleConfidence;
    }


    public Double getPlateConfidence() {
        return plateConfidence;
    }

    public void setPlateConfidence(
            Double plateConfidence
    ) {
        this.plateConfidence = plateConfidence;
    }
}