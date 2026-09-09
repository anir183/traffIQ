package com.trafficiq.trafficiq_backend.service;

import com.trafficiq.trafficiq_backend.dto.response.AlertResponse;
import com.trafficiq.trafficiq_backend.dto.response.DashboardResponse;
import com.trafficiq.trafficiq_backend.dto.response.TrafficTrendResponse;
import com.trafficiq.trafficiq_backend.dto.response.VehicleTypeCountResponse;
import com.trafficiq.trafficiq_backend.entity.Detection;
import com.trafficiq.trafficiq_backend.enums.VehicleType;
import com.trafficiq.trafficiq_backend.repository.CameraRepository;
import com.trafficiq.trafficiq_backend.repository.DetectionRepository;
import com.trafficiq.trafficiq_backend.repository.VehicleRepository;

import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class DashboardService {

    private final DetectionRepository detectionRepository;

    private final VehicleRepository vehicleRepository;

    private final CameraRepository cameraRepository;

    private final AlertService alertService;


    public DashboardService(
            DetectionRepository detectionRepository,
            VehicleRepository vehicleRepository,
            CameraRepository cameraRepository,
            AlertService alertService
    ) {
        this.detectionRepository =
                detectionRepository;

        this.vehicleRepository =
                vehicleRepository;

        this.cameraRepository =
                cameraRepository;

        this.alertService =
                alertService;
    }


    public DashboardResponse getDashboardData() {

        DashboardResponse response =
                new DashboardResponse();


        long totalVehicles =
                detectionRepository.count();

        response.setTotalVehicles(
                totalVehicles
        );


        long uniqueVehicles =
                vehicleRepository.count();

        response.setUniqueVehicles(
                uniqueVehicles
        );


        long totalCameras =
                cameraRepository.count();

        response.setTotalCameras(
                totalCameras
        );


        Double averageSpeed =
                calculateAverageSpeed();

        response.setAverageSpeed(
                averageSpeed
        );


        List<VehicleTypeCountResponse>
                vehicleTypeBreakdown =
                getVehicleTypeBreakdown();

        response.setVehicleTypeBreakdown(
                vehicleTypeBreakdown
        );


        List<TrafficTrendResponse>
                trafficTrend =
                getTodayTrafficTrend();

        response.setTrafficTrend(
                trafficTrend
        );


        List<AlertResponse>
                recentAlerts =
                alertService.getRecentAlerts();

        response.setRecentAlerts(
                recentAlerts
        );


        return response;
    }


    private Double calculateAverageSpeed() {

        List<Detection> detections =
                detectionRepository.findAll();

        double totalSpeed = 0.0;

        int speedCount = 0;


        for (Detection detection : detections) {

            Double speed =
                    detection.getSpeedKmh();

            if (speed != null) {

                totalSpeed =
                        totalSpeed + speed;

                speedCount++;
            }
        }


        if (speedCount == 0) {

            return 0.0;
        }


        return totalSpeed / speedCount;
    }


    private List<VehicleTypeCountResponse>
    getVehicleTypeBreakdown() {

        List<VehicleTypeCountResponse>
                breakdown =
                new ArrayList<>();


        for (VehicleType vehicleType
                : VehicleType.values()) {

            long count =
                    vehicleRepository
                            .findAll()
                            .stream()
                            .filter(vehicle ->
                                    vehicle.getVehicleType()
                                            == vehicleType
                            )
                            .count();


            VehicleTypeCountResponse
                    typeResponse =
                    new VehicleTypeCountResponse();

            typeResponse.setVehicleType(
                    vehicleType.name()
            );

            typeResponse.setCount(
                    count
            );


            breakdown.add(
                    typeResponse
            );
        }


        return breakdown;
    }


    private List<TrafficTrendResponse>
    getTodayTrafficTrend() {

        LocalDate today =
                LocalDate.now();


        LocalDateTime startOfToday =
                today.atStartOfDay();


        LocalDateTime startOfTomorrow =
                today
                        .plusDays(1)
                        .atStartOfDay();


        List<Detection> todayDetections =
                detectionRepository
                        .findByDetectedAtBetweenOrderByDetectedAtAsc(
                                startOfToday,
                                startOfTomorrow
                        );


        List<TrafficTrendResponse>
                trendList =
                new ArrayList<>();


        DateTimeFormatter formatter =
                DateTimeFormatter
                        .ofPattern("HH:00");


        for (int hour = 0;
             hour < 24;
             hour++) {

            LocalDateTime hourStart =
                    startOfToday
                            .plusHours(hour);

            LocalDateTime hourEnd =
                    hourStart
                            .plusHours(1);


            long vehicleCount = 0;

            double totalSpeed = 0.0;

            int speedCount = 0;


            for (Detection detection
                    : todayDetections) {

                LocalDateTime detectedAt =
                        detection.getDetectedAt();


                boolean belongsToHour =
                        !detectedAt.isBefore(
                                hourStart
                        )
                                &&
                                detectedAt.isBefore(
                                        hourEnd
                                );


                if (belongsToHour) {

                    vehicleCount++;


                    Double speed =
                            detection.getSpeedKmh();


                    if (speed != null) {

                        totalSpeed =
                                totalSpeed + speed;

                        speedCount++;
                    }
                }
            }


            Double averageSpeed =
                    speedCount == 0
                            ? 0.0
                            : totalSpeed / speedCount;


            TrafficTrendResponse
                    trendResponse =
                    new TrafficTrendResponse();


            trendResponse.setTime(
                    hourStart.format(
                            formatter
                    )
            );


            trendResponse.setVehicleCount(
                    vehicleCount
            );


            trendResponse.setAverageSpeed(
                    averageSpeed
            );


            trendList.add(
                    trendResponse
            );
        }


        return trendList;
    }
}
