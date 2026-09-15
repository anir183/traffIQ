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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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


        if (currentCamera == null) {
            return new MatchResult(
                    null,
                    null,
                    false
            );
        }

        if (currentCamera.getSequenceOrder() == null
                || currentCamera.getSequenceOrder() <= 0) {

            return new MatchResult(
                    null,
                    null,
                    false
            );
        }


        List<MlDetectionRequest.PlateCandidate> candidates =
                getValidCandidates(request);


        if (candidates.isEmpty()) {
            return new MatchResult(
                    null,
                    null,
                    false
            );
        }

        Instant currentTime;

        try {
            currentTime =
                    Instant.parse(request.getTimestamp());

        } catch (Exception exception) {


            return new MatchResult(
                    null,
                    null,
                    false
            );
        }


        Instant fromTime =
                currentTime.minus(
                        Duration.ofMinutes(matchingWindowMinutes)
                );


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


            if (!previousDetections.isEmpty()) {


                Detection previousDetection =
                        previousDetections.get(0);

                Vehicle existingVehicle =
                        previousDetection.getVehicle();


                if (existingVehicle != null) {

                    return new MatchResult(
                            existingVehicle,
                            candidate,
                            false
                    );
                }
            }
        }

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

        if (request == null
                || request.getPlate() == null
                || request.getPlate().getCandidates() == null) {

            return List.of();
        }

        Map<String, MlDetectionRequest.PlateCandidate> uniqueCandidates =
                new HashMap<>();

        for (MlDetectionRequest.PlateCandidate candidate
                : request.getPlate().getCandidates()) {

            if (!isValidCandidate(candidate)) {
                continue;
            }

            String normalizedPlate =
                    normalizePlate(candidate.getData());


            if (normalizedPlate.isBlank()) {
                continue;
            }

            MlDetectionRequest.PlateCandidate existing =
                    uniqueCandidates.get(normalizedPlate);


            if (existing == null
                    || candidate.getConfidence()
                    > existing.getConfidence()) {

                uniqueCandidates.put(
                        normalizedPlate,
                        candidate
                );
            }
        }

        List<MlDetectionRequest.PlateCandidate> result =
                new ArrayList<>(uniqueCandidates.values());


        result.sort(
                Comparator.comparing(
                        MlDetectionRequest.PlateCandidate::getConfidence
                ).reversed()
        );

        return result;
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

        if (candidate.getConfidence() < 0.0
                || candidate.getConfidence() > 1.0) {

            return false;
        }

        if (Boolean.FALSE.equals(
                candidate.getFormatValid())) {

            return false;
        }

        return true;
    }


    private String normalizePlate(String plate) {

        if (plate == null) {
            return "";
        }

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