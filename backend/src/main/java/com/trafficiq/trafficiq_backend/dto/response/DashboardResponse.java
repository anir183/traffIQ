package com.trafficiq.trafficiq_backend.dto.response;

import java.util.List;

public class DashboardResponse {

    private long totalVehicles;

    private long uniqueVehicles;

    private long activeCameras;

    private long activeAlerts;

    private List<VehicleTypeCountResponse> vehicleTypeBreakdown;

    private List<TrafficAnalysisResponse> trafficTrend;

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


    public long getActiveCameras() {
        return activeCameras;
    }

    public void setActiveCameras(
            long activeCameras
    ) {
        this.activeCameras = activeCameras;
    }


    public long getActiveAlerts() {
        return activeAlerts;
    }

    public void setActiveAlerts(
            long activeAlerts
    ) {
        this.activeAlerts = activeAlerts;
    }


    public List<VehicleTypeCountResponse> getVehicleTypeBreakdown() {
        return vehicleTypeBreakdown;
    }

    public void setVehicleTypeBreakdown(
            List<VehicleTypeCountResponse> vehicleTypeBreakdown
    ) {
        this.vehicleTypeBreakdown = vehicleTypeBreakdown;
    }


    public List<TrafficAnalysisResponse> getTrafficTrend() {
        return trafficTrend;
    }

    public void setTrafficTrend(
            List<TrafficAnalysisResponse> trafficTrend
    ) {
        this.trafficTrend = trafficTrend;
    }


    public List<AlertResponse> getRecentAlerts() {
        return recentAlerts;
    }

    public void setRecentAlerts(
            List<AlertResponse> recentAlerts
    ) {
        this.recentAlerts = recentAlerts;
    }
}