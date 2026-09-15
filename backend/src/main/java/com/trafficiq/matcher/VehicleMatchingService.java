package com.trafficiq.matcher;

import com.trafficiq.dto.input.MlDetectionRequest;
import com.trafficiq.entity.Camera;
import com.trafficiq.entity.Detection;
import com.trafficiq.entity.Vehicle;
import com.trafficiq.enums.VehicleType;
import com.trafficiq.repository.DetectionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Service
public class VehicleMatchingService {

    private final DetectionRepository detectionRepository;

    private final long matchingWindowMinutes;

    public VehicleMatchingService(
            DetectionRepository detectionRepository,
            @Value("${trafficiq.matching.window-minutes:30}")
            long matchingWindowMinutes) {

        this.detectionRepository = detectionRepository;
        this.matchingWindowMinutes = matchingWindowMinutes;
    }

    public MatchResult findVehicle(
            MlDetectionRequest request,
            Camera currentCamera) {

        List<MlDetectionRequest.PlateCandidate> candidates =
                getValidCandidates(request);

        /*
         * No valid plate candidates.
         *
         * We cannot safely identify the global vehicle.
         */
        if (candidates.isEmpty()) {
            return new MatchResult(
                    null,
                    null,
                    false
            );
        }

        Instant currentTime =
                Instant.parse(request.getTimestamp());

        Instant fromTime =
                currentTime.minus(
                        Duration.ofMinutes(matchingWindowMinutes)
                );

        /*
         * Check candidates in confidence order.
         *
         * Example:
         *
         * WB45 -> 95%
         * WB23 -> 90%
         * WB12 -> 80%
         *
         * First successful match wins.
         */
        for (MlDetectionRequest.PlateCandidate candidate : candidates) {

            String plateNumber =
                    normalizePlate(candidate.getData());

            List<Detection> previousDetections =
                    detectionRepository.findPreviousCameraDetections(
                            plateNumber,
                            currentCamera.getSequenceOrder(),
                            fromTime,
                            currentTime
                    );

            /*
             * If this candidate was found in a previous
             * camera within the allowed time window,
             * reuse that vehicle.
             */
            if (!previousDetections.isEmpty()) {

                Detection previousDetection =
                        previousDetections.get(0);

                Vehicle existingVehicle =
                        previousDetection.getVehicle();

                return new MatchResult(
                        existingVehicle,
                        candidate,
                        false
                );
            }
        }

        /*
         * No candidate matched any previous camera
         * within the allowed time window.
         *
         * Therefore create a new global vehicle.
         */
        MlDetectionRequest.PlateCandidate bestCandidate =
                candidates.get(0);

        Vehicle newVehicle = new Vehicle();

        newVehicle.setPlateNumber(
                normalizePlate(bestCandidate.getData())
        );

        newVehicle.setVehicleType(
                convertVehicleType(
                        request.getVehicle().getType()
                )
        );

        return new MatchResult(
                newVehicle,
                bestCandidate,
                true
        );
    }

    private List<MlDetectionRequest.PlateCandidate> getValidCandidates(
            MlDetectionRequest request) {

        if (request.getPlate() == null
                || request.getPlate().getCandidates() == null) {

            return List.of();
        }

        return request.getPlate()
                .getCandidates()
                .stream()
                .filter(this::isValidCandidate)
                .sorted(
                        Comparator.comparing(
                                MlDetectionRequest.PlateCandidate::getConfidence
                        ).reversed()
                )
                .toList();
    }

    private boolean isValidCandidate(
            MlDetectionRequest.PlateCandidate candidate) {

        if (candidate == null) {
            return false;
        }

        if (candidate.getData() == null
                || candidate.getData().isBlank()) {
            return false;
        }

        if (candidate.getConfidence() == null) {
            return false;
        }

        if (Boolean.FALSE.equals(candidate.getFormatValid())) {
            return false;
        }

        return true;
    }

    private String normalizePlate(String plate) {

        return plate
                .trim()
                .toUpperCase()
                .replaceAll("\\s+", "");
    }

    private VehicleType convertVehicleType(String type) {

        if (type == null || type.isBlank()) {
            return VehicleType.UNKNOWN;
        }

        try {
            return VehicleType.valueOf(
                    type.trim().toUpperCase()
            );
        } catch (IllegalArgumentException exception) {
            return VehicleType.UNKNOWN;
        }
    }

    public static class MatchResult {

        private final Vehicle vehicle;
        private final MlDetectionRequest.PlateCandidate matchedCandidate;
        private final boolean newVehicle;

        public MatchResult(
                Vehicle vehicle,
                MlDetectionRequest.PlateCandidate matchedCandidate,
                boolean newVehicle) {

            this.vehicle = vehicle;
            this.matchedCandidate = matchedCandidate;
            this.newVehicle = newVehicle;
        }

        public Vehicle getVehicle() {
            return vehicle;
        }

        public MlDetectionRequest.PlateCandidate getMatchedCandidate() {
            return matchedCandidate;
        }

        public boolean isNewVehicle() {
            return newVehicle;
        }
    }
}