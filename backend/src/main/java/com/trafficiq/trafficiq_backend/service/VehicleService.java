package com.trafficiq.trafficiq_backend.service;

import com.trafficiq.trafficiq_backend.dto.input.UpdateVehicleStatusRequest;
import com.trafficiq.trafficiq_backend.dto.response.VehicleResponse;
import com.trafficiq.trafficiq_backend.entity.Vehicle;
import com.trafficiq.trafficiq_backend.repository.VehicleRepository;
import org.springframework.stereotype.Service;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleService(
            VehicleRepository vehicleRepository
    ) {
        this.vehicleRepository = vehicleRepository;
    }

    public VehicleResponse getVehicleByPlateNumber(
            String plateNumber
    ) {
        Vehicle vehicle =
                vehicleRepository.findByPlateNumber(
                        plateNumber.trim().toUpperCase()
                ).orElseThrow(() ->
                        new IllegalArgumentException(
                                "Vehicle not found: " + plateNumber
                        )
                );

        return convertToResponse(vehicle);
    }

    public VehicleResponse updateVehicleStatus(
            String plateNumber,
            UpdateVehicleStatusRequest request
    ) {
        Vehicle vehicle =
                vehicleRepository.findByPlateNumber(
                        plateNumber.trim().toUpperCase()
                ).orElseThrow(() ->
                        new IllegalArgumentException(
                                "Vehicle not found: " + plateNumber
                        )
                );

        vehicle.setStatus(request.getStatus());

        Vehicle savedVehicle =
                vehicleRepository.save(vehicle);

        return convertToResponse(savedVehicle);
    }

    public VehicleResponse convertToResponse(
            Vehicle vehicle
    ) {
        VehicleResponse response = new VehicleResponse();

        response.setPlateNumber(vehicle.getPlateNumber());
        response.setVehicleType(vehicle.getVehicleType());
        response.setStatus(vehicle.getStatus());
        response.setFirstSeen(vehicle.getFirstSeen());
        response.setLastSeen(vehicle.getLastSeen());

        return response;
    }
}