package com.trafficiq.trafficiq_backend.dto.response;

public class TrafficTrendResponse {

    private String time;

    private long vehicleCount;

    private Double averageSpeed;


    public TrafficTrendResponse() {
    }


    public String getTime() {
        return time;
    }

    public void setTime(
            String time
    ) {
        this.time = time;
    }


    public long getVehicleCount() {
        return vehicleCount;
    }

    public void setVehicleCount(
            long vehicleCount
    ) {
        this.vehicleCount = vehicleCount;
    }


    public Double getAverageSpeed() {
        return averageSpeed;
    }

    public void setAverageSpeed(
            Double averageSpeed
    ) {
        this.averageSpeed = averageSpeed;
    }
}
