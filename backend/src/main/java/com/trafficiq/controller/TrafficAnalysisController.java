package com.trafficiq.controller;

import com.trafficiq.dto.response.TrafficTrendResponse;
import com.trafficiq.service.TrafficAnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/traffic-analysis")
public class TrafficAnalysisController {

    private final TrafficAnalysisService trafficAnalysisService;

    public TrafficAnalysisController(
            TrafficAnalysisService trafficAnalysisService) {

        this.trafficAnalysisService = trafficAnalysisService;
    }

    @GetMapping("/trend")
    public ResponseEntity<List<TrafficTrendResponse>> getTrafficTrend() {

        List<TrafficTrendResponse> trend =
                trafficAnalysisService.getTrafficTrend();

        return ResponseEntity.ok(trend);
    }
}