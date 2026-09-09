package com.trafficiq.trafficiq_backend.dto.response;

import java.util.List;

public class DashboardResponse {

    private long totalVehicles;

    private long uniqueVehicles;

    private long totalCameras;

    private Double averageSpeed;

    private List<VehicleTypeCountResponse> vehicleTypeBreakdown;

    private List<TrafficTrendResponse> trafficTrend;

    private List<AlertResponse> recentAlerts;


    public DashboardResponse() {
    }


    public long getTotalVehicles() {
        return totalVehicles;
    }

    public void setTotalVehicles(
            long totalVehicles
    ) {
        this.totalVehicles = totalVehicles;
    }


    public long getUniqueVehicles() {
        return uniqueVehicles;
    }

    public void setUniqueVehicles(
            long uniqueVehicles
    ) {
        this.uniqueVehicles = uniqueVehicles;
    }


    public long getTotalCameras() {
        return totalCameras;
    }

    public void setTotalCameras(
            long totalCameras
    ) {
        this.totalCameras = totalCameras;
    }


    public Double getAverageSpeed() {
        return averageSpeed;
    }

    public void setAverageSpeed(
            Double averageSpeed
    ) {
        this.averageSpeed = averageSpeed;
    }


    public List<VehicleTypeCountResponse>
    getVehicleTypeBreakdown() {
        return vehicleTypeBreakdown;
    }

    public void setVehicleTypeBreakdown(
            List<VehicleTypeCountResponse>
                    vehicleTypeBreakdown
    ) {
        this.vehicleTypeBreakdown =
                vehicleTypeBreakdown;
    }


    public List<TrafficTrendResponse>
    getTrafficTrend() {
        return trafficTrend;
    }

    public void setTrafficTrend(
            List<TrafficTrendResponse>
                    trafficTrend
    ) {
        this.trafficTrend =
                trafficTrend;
    }


    public List<AlertResponse>
    getRecentAlerts() {
        return recentAlerts;
    }

    public void setRecentAlerts(
            List<AlertResponse>
                    recentAlerts
    ) {
        this.recentAlerts =
                recentAlerts;
    }
}