package com.trafficiq.trafficiq_backend.dto.input;

import com.trafficiq.trafficiq_backend.enums.VehicleStatus;

import jakarta.validation.constraints.NotNull;

public class UpdateVehicleStatusRequest {

    @NotNull
    private VehicleStatus status;

    public UpdateVehicleStatusRequest() {
    }

    public VehicleStatus getStatus() {
        return status;
    }

    public void setStatus(
            VehicleStatus status
    ) {
        this.status = status;
    }
}
