package com.trafficiq.dto.response;

import java.time.Instant;

public class TrafficTrendResponse {

    private Instant time;
    private long vehicleCount;

    public TrafficTrendResponse() {
    }

    public TrafficTrendResponse(
            Instant time,
            long vehicleCount) {

        this.time = time;
        this.vehicleCount = vehicleCount;
    }

    public Instant getTime() {
        return time;
    }

    public void setTime(Instant time) {
        this.time = time;
    }

    public long getVehicleCount() {
        return vehicleCount;
    }

    public void setVehicleCount(long vehicleCount) {
        this.vehicleCount = vehicleCount;
    }
}