package com.trafficiq.controller;

import com.trafficiq.dto.response.TrajectoryPoint;
import com.trafficiq.dto.response.VehicleResponse;
import com.trafficiq.service.VehicleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public ResponseEntity<VehicleResponse> getVehicle(
            @RequestParam String plateNumber) {

        VehicleResponse response =
                vehicleService.findByPlateNumber(plateNumber);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{vehicleId}/trajectory")
    public ResponseEntity<List<TrajectoryPoint>> getTrajectory(
            @PathVariable Long vehicleId) {

        List<TrajectoryPoint> trajectory =
                vehicleService.getTrajectory(vehicleId);

        return ResponseEntity.ok(trajectory);
    }
}