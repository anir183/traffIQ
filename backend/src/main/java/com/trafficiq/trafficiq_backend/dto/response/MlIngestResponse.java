package com.trafficiq.trafficiq_backend.dto.response;


public class MlIngestResponse {

    private boolean success;

    private String message;

    private String eventId;


    public MlIngestResponse() {
    }


    public MlIngestResponse(
            boolean success,
            String message,
            String eventId
    ) {
        this.success = success;
        this.message = message;
        this.eventId = eventId;
    }


    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }


    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }


    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }
}
