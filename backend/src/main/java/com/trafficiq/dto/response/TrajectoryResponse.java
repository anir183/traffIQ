package com.trafficiq.dto.response;

import java.util.List;

public class TrajectoryResponse {

    private VehicleResponse vehicle;
    private List<TrajectoryPoint> trajectory;

    public TrajectoryResponse() {
    }

    public TrajectoryResponse(
            VehicleResponse vehicle,
            List<TrajectoryPoint> trajectory) {

        this.vehicle = vehicle;
        this.trajectory = trajectory;
    }

    public VehicleResponse getVehicle() {
        return vehicle;
    }

    public void setVehicle(VehicleResponse vehicle) {
        this.vehicle = vehicle;
    }

    public List<TrajectoryPoint> getTrajectory() {
        return trajectory;
    }

    public void setTrajectory(
            List<TrajectoryPoint> trajectory) {

        this.trajectory = trajectory;
    }
}