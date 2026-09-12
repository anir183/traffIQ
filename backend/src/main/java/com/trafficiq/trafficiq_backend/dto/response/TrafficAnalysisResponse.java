package com.trafficiq.trafficiq_backend.dto.response;

import java.util.List;

public class TrafficAnalysisResponse {

    private long totalVehicles;

    private long uniqueVehicles;

    private Double averageSpeedKmh;

    private Double congestionScore;

    private List<TrafficTrendResponse> trafficTrend;

    private List<TrafficTrendResponse> averageSpeedTrend;

    private List<VehicleTypeCountResponse> vehicleTypeBreakdown;

    public TrafficAnalysisResponse() {
    }

    public long getTotalVehicles() {
        return totalVehicles;
    }

    public void setTotalVehicles(long totalVehicles) {
        this.totalVehicles = totalVehicles;
    }

    public long getUniqueVehicles() {
        return uniqueVehicles;
    }

    public void setUniqueVehicles(long uniqueVehicles) {
        this.uniqueVehicles = uniqueVehicles;
    }

    public Double getAverageSpeedKmh() {
        return averageSpeedKmh;
    }

    public void setAverageSpeedKmh(Double averageSpeedKmh) {
        this.averageSpeedKmh = averageSpeedKmh;
    }

    public Double getCongestionScore() {
        return congestionScore;
    }

    public void setCongestionScore(Double congestionScore) {
        this.congestionScore = congestionScore;
    }

    public List<TrafficTrendResponse> getTrafficTrend() {
        return trafficTrend;
    }

    public void setTrafficTrend(
            List<TrafficTrendResponse> trafficTrend
    ) {
        this.trafficTrend = trafficTrend;
    }

    public List<TrafficTrendResponse> getAverageSpeedTrend() {
        return averageSpeedTrend;
    }

    public void setAverageSpeedTrend(
            List<TrafficTrendResponse> averageSpeedTrend
    ) {
        this.averageSpeedTrend = averageSpeedTrend;
    }

    public List<VehicleTypeCountResponse> getVehicleTypeBreakdown() {
        return vehicleTypeBreakdown;
    }

    public void setVehicleTypeBreakdown(
            List<VehicleTypeCountResponse> vehicleTypeBreakdown
    ) {
        this.vehicleTypeBreakdown = vehicleTypeBreakdown;
    }
}