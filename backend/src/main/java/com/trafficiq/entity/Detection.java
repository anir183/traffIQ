package com.trafficiq.entity;

import com.trafficiq.enums.Direction;
import com.trafficiq.enums.VehicleType;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "detection")
public class Detection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true, length = 100)
    private String eventId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "camera_id", nullable = false)
    private Camera camera;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @Column(name = "detected_at", nullable = false)
    private Instant detectedAt;

    @Column(name = "plate_number", length = 30)
    private String plateNumber;

    @Column(name = "plate_confidence")
    private Double plateConfidence;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false, length = 20)
    private VehicleType vehicleType;

    @Column(name = "vehicle_confidence")
    private Double vehicleConfidence;

    @Column(name = "speed_kmh")
    private Double speedKmh;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", length = 20)
    private Direction direction;

    @Column(name = "local_track_id")
    private Long localTrackId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Detection() {
    }

    public Long getId() {
        return id;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
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

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public Instant getDetectedAt() {
        return detectedAt;
    }

    public void setDetectedAt(Instant detectedAt) {
        this.detectedAt = detectedAt;
    }

    public String getPlateNumber() {
        return plateNumber;
    }

    public void setPlateNumber(String plateNumber) {
        this.plateNumber = plateNumber;
    }

    public Double getPlateConfidence() {
        return plateConfidence;
    }

    public void setPlateConfidence(Double plateConfidence) {
        this.plateConfidence = plateConfidence;
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

    public Long getLocalTrackId() {
        return localTrackId;
    }

    public void setLocalTrackId(Long localTrackId) {
        this.localTrackId = localTrackId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}