package com.trafficiq.trafficiq_backend.dto.response;

import com.trafficiq.trafficiq_backend.enums.VehicleStatus;
import com.trafficiq.trafficiq_backend.enums.VehicleType;

import java.time.LocalDateTime;

public class VehicleResponse {

    private String plateNumber;

    private VehicleType vehicleType;

    private VehicleStatus status;

    private LocalDateTime firstSeen;

    private LocalDateTime lastSeen;


    public VehicleResponse() {
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