package com.trafficiq.trafficiq_backend.controller;

import com.trafficiq.trafficiq_backend.dto.response.TrafficAnalysisResponse;
import com.trafficiq.trafficiq_backend.service.TrafficAnalysisService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/traffic-analysis")
public class TrafficAnalysisController {

    private final TrafficAnalysisService trafficAnalysisService;

    public TrafficAnalysisController(
            TrafficAnalysisService trafficAnalysisService
    ) {
        this.trafficAnalysisService =
                trafficAnalysisService;
    }

    @GetMapping
    public TrafficAnalysisResponse getTrafficAnalysis() {
        return trafficAnalysisService
                .getTrafficAnalysis();
    }
}