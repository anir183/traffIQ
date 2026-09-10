package com.trafficiq.trafficiq_backend.service;

import com.trafficiq.trafficiq_backend.dto.response.TrafficAnalysisResponse;
import com.trafficiq.trafficiq_backend.dto.response.TrafficTrendResponse;
import com.trafficiq.trafficiq_backend.dto.response.VehicleTypeCountResponse;
import com.trafficiq.trafficiq_backend.entity.Detection;
import com.trafficiq.trafficiq_backend.enums.VehicleType;
import com.trafficiq.trafficiq_backend.repository.DetectionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TrafficAnalysisService {

    private static final double SPEED_LIMIT = 60.0;

    private final DetectionRepository detectionRepository;

    public TrafficAnalysisService(
            DetectionRepository detectionRepository
    ) {
        this.detectionRepository =
                detectionRepository;
    }

    public TrafficAnalysisResponse getTrafficAnalysis() {

        LocalDateTime start =
                LocalDate.now()
                        .atStartOfDay();

        LocalDateTime end =
                start.plusDays(1);

        List<Detection> detections =
                detectionRepository.findAll()
                        .stream()
                        .filter(detection ->
                                !detection.getDetectedAt()
                                        .isBefore(start)
                                        && detection.getDetectedAt()
                                        .isBefore(end)
                        )
                        .sorted(
                                Comparator.comparing(
                                        Detection::getDetectedAt
                                )
                        )
                        .toList();

        TrafficAnalysisResponse response =
                new TrafficAnalysisResponse();

        response.setTotalVehicles(
                detections.size()
        );

        Set<String> uniquePlates =
                detections.stream()
                        .filter(detection ->
                                detection.getVehicle() != null
                                        && detection.getVehicle()
                                        .getPlateNumber() != null
                        )
                        .map(detection ->
                                detection.getVehicle()
                                        .getPlateNumber()
                        )
                        .collect(Collectors.toSet());

        response.setUniqueVehicles(
                uniquePlates.size()
        );

        double averageSpeed =
                detections.stream()
                        .map(Detection::getSpeedKmh)
                        .filter(speed -> speed != null)
                        .mapToDouble(Double::doubleValue)
                        .average()
                        .orElse(0.0);

        response.setAverageSpeedKmh(
                Math.round(averageSpeed * 100.0) / 100.0
        );

        response.setCongestionScore(
                calculateCongestionScore(
                        averageSpeed
                )
        );

        response.setTrafficTrend(
                buildTrafficTrend(detections)
        );

        response.setAverageSpeedTrend(
                buildAverageSpeedTrend(detections)
        );

        response.setVehicleTypeBreakdown(
                getVehicleTypeBreakdownToday(detections)
        );

        return response;
    }

    public long getTotalVehiclesToday() {

        LocalDateTime start =
                LocalDate.now()
                        .atStartOfDay();

        LocalDateTime end =
                start.plusDays(1);

        return detectionRepository
                .countByDetectedAtBetween(
                        start,
                        end
                );
    }

    public long getVehicleTypeCountToday(
            VehicleType vehicleType
    ) {

        LocalDateTime start =
                LocalDate.now()
                        .atStartOfDay();

        LocalDateTime end =
                start.plusDays(1);

        return detectionRepository
                .countByVehicleVehicleTypeAndDetectedAtBetween(
                        vehicleType,
                        start,
                        end
                );
    }

    public List<VehicleTypeCountResponse>
    getVehicleTypeBreakdownToday() {

        return Arrays.stream(VehicleType.values())
                .map(type -> {

                    VehicleTypeCountResponse response =
                            new VehicleTypeCountResponse();

                    response.setVehicleType(
                            type.name()
                    );

                    response.setCount(
                            getVehicleTypeCountToday(type)
                    );

                    return response;
                })
                .toList();
    }

    private List<VehicleTypeCountResponse>
    getVehicleTypeBreakdownToday(
            List<Detection> detections
    ) {

        return Arrays.stream(VehicleType.values())
                .map(type -> {

                    long count =
                            detections.stream()
                                    .filter(detection ->
                                            detection.getVehicle() != null
                                                    && detection.getVehicle()
                                                    .getVehicleType()
                                                    == type
                                    )
                                    .count();

                    VehicleTypeCountResponse response =
                            new VehicleTypeCountResponse();

                    response.setVehicleType(
                            type.name()
                    );

                    response.setCount(count);

                    return response;
                })
                .toList();
    }

    private List<TrafficTrendResponse>
    buildTrafficTrend(
            List<Detection> detections
    ) {

        Map<Integer, Long> counts =
                new LinkedHashMap<>();

        for (int hour = 0; hour < 24; hour += 4) {
            counts.put(hour, 0L);
        }

        for (Detection detection : detections) {

            int hour =
                    detection.getDetectedAt()
                            .getHour();

            int bucket =
                    (hour / 4) * 4;

            counts.put(
                    bucket,
                    counts.get(bucket) + 1
            );
        }

        return counts.entrySet()
                .stream()
                .map(entry ->
                        new TrafficTrendResponse(
                                String.format(
                                        "%02d:00",
                                        entry.getKey()
                                ),
                                entry.getValue()
                                        .doubleValue()
                        )
                )
                .toList();
    }

    private List<TrafficTrendResponse>
    buildAverageSpeedTrend(
            List<Detection> detections
    ) {

        Map<Integer, List<Double>> speeds =
                new LinkedHashMap<>();

        for (int hour = 0; hour < 24; hour += 4) {
            speeds.put(
                    hour,
                    new java.util.ArrayList<>()
            );
        }

        for (Detection detection : detections) {

            if (detection.getSpeedKmh() == null) {
                continue;
            }

            int hour =
                    detection.getDetectedAt()
                            .getHour();

            int bucket =
                    (hour / 4) * 4;

            speeds.get(bucket)
                    .add(
                            detection.getSpeedKmh()
                    );
        }

        return speeds.entrySet()
                .stream()
                .map(entry -> {

                    double average =
                            entry.getValue()
                                    .stream()
                                    .mapToDouble(
                                            Double::doubleValue
                                    )
                                    .average()
                                    .orElse(0.0);

                    average =
                            Math.round(
                                    average * 100.0
                            ) / 100.0;

                    return new TrafficTrendResponse(
                            String.format(
                                    "%02d:00",
                                    entry.getKey()
                            ),
                            average
                    );
                })
                .toList();
    }

    private double calculateCongestionScore(
            double averageSpeed
    ) {

        if (averageSpeed <= 0) {
            return 100.0;
        }

        double score =
                100.0
                        - (
                        (averageSpeed / SPEED_LIMIT)
                                * 100.0
                );

        score =
                Math.max(
                        0.0,
                        Math.min(
                                100.0,
                                score
                        )
                );

        return Math.round(
                score * 100.0
        ) / 100.0;
    }
}