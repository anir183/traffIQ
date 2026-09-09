package com.trafficiq.trafficiq_backend.entity;


import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "detections")
public class Detection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(
            name = "event_id",
            nullable = false,
            unique = true
    )
    private String eventId;


    @Column(name = "local_track_id")
    private Integer localTrackId;


    @Column(
            name = "detected_at",
            nullable = false
    )
    private LocalDateTime detectedAt;


    @Column(
            name = "first_seen",
            nullable = false
    )
    private LocalDateTime firstSeen;


    @Column(
            name = "last_seen",
            nullable = false
    )
    private LocalDateTime lastSeen;



    @Column(name = "speed_kmh")
    private Double speedKmh;


    private String direction;



    @Column(name = "vehicle_confidence")
    private Double vehicleConfidence;


    @Column(name = "plate_confidence")
    private Double plateConfidence;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "vehicle_id",
            nullable = false
    )
    private Vehicle vehicle;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "camera_id",
            nullable = false
    )
    private Camera camera;



    public Detection() {
    }



    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }


    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }


    public Integer getLocalTrackId() {
        return localTrackId;
    }

    public void setLocalTrackId(Integer localTrackId) {
        this.localTrackId = localTrackId;
    }


    public LocalDateTime getDetectedAt() {
        return detectedAt;
    }

    public void setDetectedAt(LocalDateTime detectedAt) {
        this.detectedAt = detectedAt;
    }



    public LocalDateTime getFirstSeen() {
        return firstSeen;
    }

    public void setFirstSeen(LocalDateTime firstSeen) {
        this.firstSeen = firstSeen;
    }



    public LocalDateTime getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(LocalDateTime lastSeen) {
        this.lastSeen = lastSeen;
    }


    public Double getSpeedKmh() {
        return speedKmh;
    }

    public void setSpeedKmh(Double speedKmh) {
        this.speedKmh = speedKmh;
    }



    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
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


    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }


    public Camera getCamera() {
        return camera;
    }

    public void setCamera(Camera camera) {
        this.camera = camera;
    }
}