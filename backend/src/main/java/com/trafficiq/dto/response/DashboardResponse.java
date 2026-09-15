package com.trafficiq.dto.response;

import java.util.List;

public class DashboardResponse {

    private long totalVehicles;
    private long totalDetections;
    private List<VehicleTypeCountResponse> vehicleTypeCounts;

    public DashboardResponse() {
    }

    public DashboardResponse(
            long totalVehicles,
            long totalDetections,
            List<VehicleTypeCountResponse> vehicleTypeCounts) {

        this.totalVehicles = totalVehicles;
        this.totalDetections = totalDetections;
        this.vehicleTypeCounts = vehicleTypeCounts;
    }

    public long getTotalVehicles() {
        return totalVehicles;
    }

    public void setTotalVehicles(long totalVehicles) {
        this.totalVehicles = totalVehicles;
    }

    public long getTotalDetections() {
        return totalDetections;
    }

    public void setTotalDetections(long totalDetections) {
        this.totalDetections = totalDetections;
    }

    public List<VehicleTypeCountResponse> getVehicleTypeCounts() {
        return vehicleTypeCounts;
    }

    public void setVehicleTypeCounts(
            List<VehicleTypeCountResponse> vehicleTypeCounts) {

        this.vehicleTypeCounts = vehicleTypeCounts;
    }
}