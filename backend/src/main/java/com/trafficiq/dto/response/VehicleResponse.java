package com.trafficiq.dto.response;

import com.trafficiq.enums.VehicleType;

import java.time.Instant;

public class VehicleResponse {

    private Long vehicleId;
    private String plateNumber;
    private VehicleType vehicleType;
    private Instant firstSeen;
    private Instant lastSeen;
    private Integer totalDetections;

    public VehicleResponse() {
    }

    public VehicleResponse(
            Long vehicleId,
            String plateNumber,
            VehicleType vehicleType,
            Instant firstSeen,
            Instant lastSeen,
            Integer totalDetections) {

        this.vehicleId = vehicleId;
        this.plateNumber = plateNumber;
        this.vehicleType = vehicleType;
        this.firstSeen = firstSeen;
        this.lastSeen = lastSeen;
        this.totalDetections = totalDetections;
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

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public Instant getFirstSeen() {
        return firstSeen;
    }

    public void setFirstSeen(Instant firstSeen) {
        this.firstSeen = firstSeen;
    }

    public Instant getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(Instant lastSeen) {
        this.lastSeen = lastSeen;
    }

    public Integer getTotalDetections() {
        return totalDetections;
    }

    public void setTotalDetections(Integer totalDetections) {
        this.totalDetections = totalDetections;
    }
}