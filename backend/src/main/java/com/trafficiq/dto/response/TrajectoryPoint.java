package com.trafficiq.dto.response;

import java.time.Instant;

public class TrajectoryPoint {

    private Instant time;
    private String camera;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private Double confidence;

    public TrajectoryPoint() {
    }

    public TrajectoryPoint(
            Instant time,
            String camera,
            Double latitude,
            Double longitude,
            Double speed,
            Double confidence) {

        this.time = time;
        this.camera = camera;
        this.latitude = latitude;
        this.longitude = longitude;
        this.speed = speed;
        this.confidence = confidence;
    }

    public Instant getTime() {
        return time;
    }

    public void setTime(Instant time) {
        this.time = time;
    }

    public String getCamera() {
        return camera;
    }

    public void setCamera(String camera) {
        this.camera = camera;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }
}