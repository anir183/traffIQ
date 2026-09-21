package com.trafficiq.websocket;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class LiveDetectionPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public LiveDetectionPublisher(
            SimpMessagingTemplate messagingTemplate) {

        this.messagingTemplate = messagingTemplate;
    }

    public void publish(
            Long vehicleId,
            String eventId,
            Long localTrackId,
            String plateNumber,
            String vehicleType,
            String cameraId,
            String detectedAt,
            Double speedKmh,
            String direction,
            Double vehicleConfidence,
            Double plateConfidence) {

        Map<String, Object> payload =
                new LinkedHashMap<>();

        payload.put("id", vehicleId);
        payload.put("eventId", eventId);
        payload.put("localTrackId", localTrackId);
        payload.put("plateNumber", plateNumber);
        payload.put("vehicleType", vehicleType);
        payload.put("cameraId", cameraId);
        payload.put("detectedAt", detectedAt);
        payload.put("speedKmh", speedKmh);
        payload.put("direction", direction);
        payload.put("vehicleConfidence", vehicleConfidence);
        payload.put("plateConfidence", plateConfidence);

        messagingTemplate.convertAndSend(
                "/topic/live-detections",
                (Object) payload
        );
    }
}