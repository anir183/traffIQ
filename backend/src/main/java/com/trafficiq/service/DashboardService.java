package com.trafficiq.service;

import com.trafficiq.dto.response.DashboardResponse;
import com.trafficiq.dto.response.VehicleTypeCountResponse;
import com.trafficiq.entity.Detection;
import com.trafficiq.enums.VehicleType;
import com.trafficiq.repository.DetectionRepository;
import com.trafficiq.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
public class DashboardService {

    private final VehicleRepository vehicleRepository;
    private final DetectionRepository detectionRepository;

    public DashboardService(
            VehicleRepository vehicleRepository,
            DetectionRepository detectionRepository) {

        this.vehicleRepository = vehicleRepository;
        this.detectionRepository = detectionRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {

        long totalVehicles =
                vehicleRepository.count();

        long totalDetections =
                detectionRepository.count();

        List<Detection> detections =
                detectionRepository.findAll();

        long cars = countByType(detections, VehicleType.CAR);
        long bikes = countByType(detections, VehicleType.BIKE);
        long buses = countByType(detections, VehicleType.BUS);
        long trucks = countByType(detections, VehicleType.TRUCK);
        long unknown = countByType(detections, VehicleType.UNKNOWN);

        List<VehicleTypeCountResponse> vehicleTypeCounts =
                Arrays.asList(
                        new VehicleTypeCountResponse(
                                VehicleType.CAR,
                                cars
                        ),
                        new VehicleTypeCountResponse(
                                VehicleType.BIKE,
                                bikes
                        ),
                        new VehicleTypeCountResponse(
                                VehicleType.BUS,
                                buses
                        ),
                        new VehicleTypeCountResponse(
                                VehicleType.TRUCK,
                                trucks
                        ),
                        new VehicleTypeCountResponse(
                                VehicleType.UNKNOWN,
                                unknown
                        )
                );

        return new DashboardResponse(
                totalVehicles,
                totalDetections,
                vehicleTypeCounts
        );
    }

    private long countByType(
            List<Detection> detections,
            VehicleType vehicleType) {

        return detections.stream()
                .filter(detection ->
                        detection.getVehicleType() == vehicleType)
                .count();
    }
}