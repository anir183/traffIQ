package com.trafficiq.trafficiq_backend.controller;

import com.trafficiq.trafficiq_backend.dto.response.AlertResponse;
import com.trafficiq.trafficiq_backend.enums.AlertStatus;
import com.trafficiq.trafficiq_backend.enums.AlertType;
import com.trafficiq.trafficiq_backend.service.AlertService;

import org.springframework.http.ResponseEntity;
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
        this.alertService = alertService;
    }

    @GetMapping("/recent")
    public ResponseEntity<List<AlertResponse>> getRecentAlerts() {

        List<AlertResponse> response =
                alertService.getRecentAlerts();

        return ResponseEntity.ok(
                response
        );
    }

    @GetMapping
    public ResponseEntity<List<AlertResponse>> getAlerts(
            @RequestParam(required = false) AlertStatus status,
            @RequestParam(required = false) AlertType type
    ) {

        if (status != null) {

            List<AlertResponse> response =
                    alertService.getAlertsByStatus(
                            status
                    );

            return ResponseEntity.ok(
                    response
            );
        }

        if (type != null) {

            List<AlertResponse> response =
                    alertService.getAlertsByType(
                            type
                    );

            return ResponseEntity.ok(
                    response
            );
        }

        List<AlertResponse> response =
                alertService.getRecentAlerts();

        return ResponseEntity.ok(
                response
        );
    }

    @PatchMapping("/{alertId}/seen")
    public ResponseEntity<AlertResponse> markAlertAsSeen(
            @PathVariable Long alertId
    ) {

        AlertResponse response =
                alertService.markAlertAsSeen(
                        alertId
                );

        return ResponseEntity.ok(
                response
        );
    }

    @PatchMapping("/{alertId}/resolve")
    public ResponseEntity<AlertResponse> resolveAlert(
            @PathVariable Long alertId
    ) {

        AlertResponse response =
                alertService.resolveAlert(
                        alertId
                );

        return ResponseEntity.ok(
                response
        );
    }
}