package com.trafficiq.service;

import com.trafficiq.dto.response.TrafficTrendResponse;
import com.trafficiq.entity.Detection;
import com.trafficiq.repository.DetectionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class TrafficAnalysisService {

    private final DetectionRepository detectionRepository;

    public TrafficAnalysisService(
            DetectionRepository detectionRepository) {

        this.detectionRepository = detectionRepository;
    }

    @Transactional(readOnly = true)
    public List<TrafficTrendResponse> getTrafficTrend() {

        List<Detection> detections =
                detectionRepository.findAll();

        Map<Instant, Long> hourlyCounts =
                detections.stream()
                        .collect(Collectors.groupingBy(
                                detection ->
                                        detection.getDetectedAt()
                                                .truncatedTo(
                                                        ChronoUnit.HOURS
                                                ),
                                TreeMap::new,
                                Collectors.counting()
                        ));

        return hourlyCounts.entrySet()
                .stream()
                .map(entry ->
                        new TrafficTrendResponse(
                                entry.getKey(),
                                entry.getValue()
                        )
                )
                .toList();
    }
}