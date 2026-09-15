package com.trafficiq.dto.input;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class MlDetectionRequest {

    @NotBlank
    private String eventId;

    @NotBlank
    private String eventType;

    @NotBlank
    private String cameraId;

    @NotBlank
    private String timestamp;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    private Long localTrackId;

    @Valid
    @NotNull
    private VehicleData vehicle;

    @Valid
    private PlateData plate;

    @Valid
    private SpeedData speed;

    private BoundingBox plateBbox;

    private Long frameNumber;

    private Long sourceVideoTimestampMs;

    public MlDetectionRequest() {
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getCameraId() {
        return cameraId;
    }

    public void setCameraId(String cameraId) {
        this.cameraId = cameraId;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Long getLocalTrackId() {
        return localTrackId;
    }

    public void setLocalTrackId(Long localTrackId) {
        this.localTrackId = localTrackId;
    }

    public VehicleData getVehicle() {
        return vehicle;
    }

    public void setVehicle(VehicleData vehicle) {
        this.vehicle = vehicle;
    }

    public PlateData getPlate() {
        return plate;
    }

    public void setPlate(PlateData plate) {
        this.plate = plate;
    }

    public SpeedData getSpeed() {
        return speed;
    }

    public void setSpeed(SpeedData speed) {
        this.speed = speed;
    }

    public BoundingBox getPlateBbox() {
        return plateBbox;
    }

    public void setPlateBbox(BoundingBox plateBbox) {
        this.plateBbox = plateBbox;
    }

    public Long getFrameNumber() {
        return frameNumber;
    }

    public void setFrameNumber(Long frameNumber) {
        this.frameNumber = frameNumber;
    }

    public Long getSourceVideoTimestampMs() {
        return sourceVideoTimestampMs;
    }

    public void setSourceVideoTimestampMs(Long sourceVideoTimestampMs) {
        this.sourceVideoTimestampMs = sourceVideoTimestampMs;
    }

    public static class VehicleData {

        @NotBlank
        private String type;

        private Double typeConfidence;

        private BoundingBox bbox;

        public VehicleData() {
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public Double getTypeConfidence() {
            return typeConfidence;
        }

        public void setTypeConfidence(Double typeConfidence) {
            this.typeConfidence = typeConfidence;
        }

        public BoundingBox getBbox() {
            return bbox;
        }

        public void setBbox(BoundingBox bbox) {
            this.bbox = bbox;
        }
    }

    public static class PlateData {

        @Valid
        private List<PlateCandidate> candidates;

        public PlateData() {
        }

        public List<PlateCandidate> getCandidates() {
            return candidates;
        }

        public void setCandidates(List<PlateCandidate> candidates) {
            this.candidates = candidates;
        }
    }

    public static class PlateCandidate {

        private String data;

        private Double confidence;

        private Boolean formatValid;

        private String stateCode;

        private Boolean stateAutoCorrected;

        public PlateCandidate() {
        }

        public String getData() {
            return data;
        }

        public void setData(String data) {
            this.data = data;
        }

        public Double getConfidence() {
            return confidence;
        }

        public void setConfidence(Double confidence) {
            this.confidence = confidence;
        }

        public Boolean getFormatValid() {
            return formatValid;
        }

        public void setFormatValid(Boolean formatValid) {
            this.formatValid = formatValid;
        }

        public String getStateCode() {
            return stateCode;
        }

        public void setStateCode(String stateCode) {
            this.stateCode = stateCode;
        }

        public Boolean getStateAutoCorrected() {
            return stateAutoCorrected;
        }

        public void setStateAutoCorrected(Boolean stateAutoCorrected) {
            this.stateAutoCorrected = stateAutoCorrected;
        }
    }

    public static class SpeedData {

        private Double valueKmh;

        private Boolean estimated;

        private String direction;

        public SpeedData() {
        }

        public Double getValueKmh() {
            return valueKmh;
        }

        public void setValueKmh(Double valueKmh) {
            this.valueKmh = valueKmh;
        }

        public Boolean getEstimated() {
            return estimated;
        }

        public void setEstimated(Boolean estimated) {
            this.estimated = estimated;
        }

        public String getDirection() {
            return direction;
        }

        public void setDirection(String direction) {
            this.direction = direction;
        }
    }

    public static class BoundingBox {

        private Double x1;
        private Double y1;
        private Double x2;
        private Double y2;

        public BoundingBox() {
        }

        public Double getX1() {
            return x1;
        }

        public void setX1(Double x1) {
            this.x1 = x1;
        }

        public Double getY1() {
            return y1;
        }

        public void setY1(Double y1) {
            this.y1 = y1;
        }

        public Double getX2() {
            return x2;
        }

        public void setX2(Double x2) {
            this.x2 = x2;
        }

        public Double getY2() {
            return y2;
        }

        public void setY2(Double y2) {
            this.y2 = y2;
        }
    }
}