package com.trafficiq.trafficiq_backend.dto.response;

public class VehicleTypeCountResponse {

    private String vehicleType;

    private long count;


    public VehicleTypeCountResponse() {
    }


    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(
            String vehicleType
    ) {
        this.vehicleType = vehicleType;
    }


    public long getCount() {
        return count;
    }

    public void setCount(
            long count
    ) {
        this.count = count;
    }
}