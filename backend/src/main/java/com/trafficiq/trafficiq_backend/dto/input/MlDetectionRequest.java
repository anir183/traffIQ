package com.trafficiq.trafficiq_backend.dto.input;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class MlDetectionRequest {


    // TOP LEVEL ML EVENT DATA


    @NotBlank
    @JsonProperty("event_id")
    private String eventId;


    @JsonProperty("event_type")
    private String eventType;


    @NotBlank
    @JsonProperty("camera_id")
    private String cameraId;


    @NotBlank
    private String timestamp;


    @JsonProperty("local_track_id")
    private Integer localTrackId;

    @NotNull
    @Valid
    private VehicleData vehicle;
    @NotNull
    @Valid
    private PlateData plate;
    @Valid
    private SpeedData speed;
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


    public Integer getLocalTrackId() {
        return localTrackId;
    }

    public void setLocalTrackId(Integer localTrackId) {
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



    // VEHICLE NESTED DTO


    public static class VehicleData {

        @NotBlank
        private String type;


        @JsonProperty("type_confidence")
        private Double typeConfidence;


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
    }



    // PLATE NESTED DTO


    public static class PlateData {

        @NotBlank
        private String text;


        @NotNull
        private Double confidence;


        @JsonProperty("format_valid")
        private Boolean formatValid;


        public PlateData() {
        }


        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
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
    }



    // SPEED NESTED DTO


    public static class SpeedData {

        @JsonProperty("value_kmh")
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
}