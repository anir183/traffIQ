package com.trafficiq.trafficiq_backend.entity;

import com.trafficiq.trafficiq_backend.enums.VehicleStatus;
import com.trafficiq.trafficiq_backend.enums.VehicleType;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "vehicles",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = "plateNumber"
                )
        }
)
public class Vehicle {

    @Id
    @GeneratedValue(
            strategy = GenerationType.IDENTITY
    )
    private Long id;

    @Column(
            nullable = false,
            unique = true
    )
    private String plateNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType vehicleType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleStatus status =
            VehicleStatus.NORMAL;

    @Column(nullable = false)
    private LocalDateTime firstSeen;

    @Column(nullable = false)
    private LocalDateTime lastSeen;

    public Vehicle() {
    }

    public Long getId() {
        return id;
    }

    public void setId(
            Long id
    ) {
        this.id = id;
    }

    public String getPlateNumber() {
        return plateNumber;
    }

    public void setPlateNumber(
            String plateNumber
    ) {
        this.plateNumber = plateNumber;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(
            VehicleType vehicleType
    ) {
        this.vehicleType = vehicleType;
    }

    public VehicleStatus getStatus() {
        return status;
    }

    public void setStatus(
            VehicleStatus status
    ) {
        this.status = status;
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
}