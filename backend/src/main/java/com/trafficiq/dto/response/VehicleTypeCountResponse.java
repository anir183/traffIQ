package com.trafficiq.dto.response;

import com.trafficiq.enums.VehicleType;

public class VehicleTypeCountResponse {

    private VehicleType vehicleType;
    private long count;

    public VehicleTypeCountResponse() {
    }

    public VehicleTypeCountResponse(
            VehicleType vehicleType,
            long count) {

        this.vehicleType = vehicleType;
        this.count = count;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}