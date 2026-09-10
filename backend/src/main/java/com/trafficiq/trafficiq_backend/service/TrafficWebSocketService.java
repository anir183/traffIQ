package com.trafficiq.trafficiq_backend.service;

import com.trafficiq.trafficiq_backend.dto.response.AlertResponse;
import com.trafficiq.trafficiq_backend.dto.response.DashboardResponse;
import com.trafficiq.trafficiq_backend.dto.response.DetectionResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class TrafficWebSocketService {

    private final SimpMessagingTemplate messagingTemplate;
    private final DashboardService dashboardService;

    public TrafficWebSocketService(
            SimpMessagingTemplate messagingTemplate,
            DashboardService dashboardService
    ) {
        this.messagingTemplate = messagingTemplate;
        this.dashboardService = dashboardService;
    }

    public void broadcastDashboardUpdate() {
        DashboardResponse dashboardResponse =
                dashboardService.getDashboardData();

        messagingTemplate.convertAndSend(
                "/topic/dashboard",
                dashboardResponse
        );
    }

    public void broadcastAlertUpdate(
            AlertResponse alertResponse
    ) {
        messagingTemplate.convertAndSend(
                "/topic/alerts",
                alertResponse
        );
    }

    public void broadcastDetectionUpdate(
            DetectionResponse detectionResponse
    ) {
        messagingTemplate.convertAndSend(
                "/topic/detections",
                detectionResponse
        );
    }
}