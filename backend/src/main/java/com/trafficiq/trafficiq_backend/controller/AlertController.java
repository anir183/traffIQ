package com.trafficiq.trafficiq_backend.controller;

import com.trafficiq.trafficiq_backend.dto.response.AlertResponse;
import com.trafficiq.trafficiq_backend.enums.AlertStatus;
import com.trafficiq.trafficiq_backend.enums.AlertType;
import com.trafficiq.trafficiq_backend.service.AlertService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;


    public AlertController(
            AlertService alertService
    ) {
        this.alertService =
                alertService;
    }


    @GetMapping("/recent")
    public List<AlertResponse> getRecentAlerts() {

        return alertService
                .getRecentAlerts();
    }


    @GetMapping("/status")
    public List<AlertResponse> getAlertsByStatus(
            @RequestParam AlertStatus status
    ) {

        return alertService
                .getAlertsByStatus(
                        status
                );
    }


    @GetMapping("/type")
    public List<AlertResponse> getAlertsByType(
            @RequestParam AlertType type
    ) {

        return alertService
                .getAlertsByType(
                        type
                );
    }


    @PatchMapping("/{alertId}/seen")
    public AlertResponse markAlertAsSeen(
            @PathVariable Long alertId
    ) {

        return alertService
                .markAlertAsSeen(
                        alertId
                );
    }


    @PatchMapping("/{alertId}/resolve")
    public AlertResponse resolveAlert(
            @PathVariable Long alertId
    ) {

        return alertService
                .resolveAlert(
                        alertId
                );
    }
}