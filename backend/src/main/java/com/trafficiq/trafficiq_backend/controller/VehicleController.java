package com.trafficiq.trafficiq_backend.controller;

import com.trafficiq.trafficiq_backend.dto.input.UpdateVehicleStatusRequest;
import com.trafficiq.trafficiq_backend.dto.response.VehicleResponse;
import com.trafficiq.trafficiq_backend.service.VehicleService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;


    public VehicleController(
            VehicleService vehicleService
    ) {
        this.vehicleService =
                vehicleService;
    }


    @GetMapping("/{plateNumber}")
    public VehicleResponse getVehicle(
            @PathVariable String plateNumber
    ) {

        return vehicleService
                .getVehicleByPlateNumber(
                        plateNumber
                );
    }


    @PatchMapping("/{plateNumber}/status")
    public VehicleResponse updateVehicleStatus(
            @PathVariable String plateNumber,
            @Valid
            @RequestBody
            UpdateVehicleStatusRequest request
    ) {

        return vehicleService
                .updateVehicleStatus(
                        plateNumber,
                        request
                );
    }
}