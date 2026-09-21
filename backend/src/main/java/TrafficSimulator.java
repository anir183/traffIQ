import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;


/**
 * TrafficIQ ML Simulator
 *
 * Purpose:
 * Simulate ML ANPR detections and continuously send them
 * to the deployed TrafficIQ Spring Boot backend on Render.
 *
 * Flow:
 *
 * Java Simulator
 *       |
 *       | HTTP POST
 *       v
 * Render Backend
 *       |
 *       +---- PostgreSQL
 *       |
 *       +---- WebSocket
 *                |
 *                v
 *          React Frontend
 */
public class TrafficSimulator {


    // ============================================================
    // 1. BACKEND CONFIGURATION
    // ============================================================

    private static final String BACKEND_URL =
            "https://traffiq-backend-k1tw.onrender.com/api/ml/detections";


    /*
     * One detection cycle every 3 seconds.
     */
    private static final int SEND_INTERVAL_SECONDS = 3;


    /*
     * Print the complete JSON in console.
     */
    private static final boolean PRINT_JSON = true;


    // ============================================================
    // 2. HTTP CLIENT
    // ============================================================

    private static final HttpClient HTTP_CLIENT =
            HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(60))
                    .build();


    // ============================================================
    // 3. RANDOM
    // ============================================================

    private static final Random RANDOM = new Random();


    // ============================================================
    // 4. VEHICLE CLASS
    // ============================================================

    static class SimulatedVehicle {

        /*
         * Real vehicle plate.
         *
         * This NEVER changes for this simulated vehicle.
         *
         * Example:
         * WB12AB1234
         */
        private final String plate;


        /*
         * Vehicle type.
         *
         * CAR / BIKE / BUS / TRUCK
         */
        private final String vehicleType;


        /*
         * Continuous camera route.
         */
        private final String[] route;


        /*
         * Current position in route.
         */
        private int routePosition;


        /*
         * Local tracking ID.
         *
         * Changes whenever vehicle enters another camera.
         */
        private int localTrackId;


        /*
         * Current speed.
         */
        private double speed;


        /*
         * Current video frame.
         */
        private long frameNumber;


        /*
         * Current source-video timestamp.
         */
        private long sourceVideoTimestampMs;


        /*
         * Constructor.
         */
        SimulatedVehicle(
                String plate,
                String vehicleType,
                String[] route,
                int initialLocalTrackId,
                double initialSpeed
        ) {

            this.plate = plate;

            this.vehicleType = vehicleType;

            this.route = route;

            this.routePosition = 0;

            this.localTrackId = initialLocalTrackId;

            this.speed = initialSpeed;

            this.frameNumber = 1;

            this.sourceVideoTimestampMs = 0;
        }


        // --------------------------------------------------------
        // GETTERS
        // --------------------------------------------------------

        String getPlate() {
            return plate;
        }


        String getVehicleType() {
            return vehicleType;
        }


        String getCurrentCamera() {
            return route[routePosition];
        }


        int getLocalTrackId() {
            return localTrackId;
        }


        double getSpeed() {
            return speed;
        }


        long getFrameNumber() {
            return frameNumber;
        }


        long getSourceVideoTimestampMs() {
            return sourceVideoTimestampMs;
        }


        // --------------------------------------------------------
        // UPDATE SPEED
        // --------------------------------------------------------

        void updateSpeed() {

            /*
             * Random change between approximately
             * -2 and +2 km/h.
             */
            speed +=
                    RANDOM.nextDouble() * 4.0 - 2.0;


            /*
             * Keep realistic range.
             */
            if (speed < 20) {
                speed = 20;
            }


            if (speed > 80) {
                speed = 80;
            }
        }


        // --------------------------------------------------------
        // UPDATE FRAME
        // --------------------------------------------------------

        void updateFrame() {

            /*
             * Simulate approximately 25-75 new frames.
             */
            frameNumber +=
                    25 + RANDOM.nextInt(51);
        }


        // --------------------------------------------------------
        // UPDATE SOURCE VIDEO TIME
        // --------------------------------------------------------

        void updateSourceVideoTimestamp() {

            /*
             * Approximately 3 seconds of source video.
             */
            sourceVideoTimestampMs +=
                    3000 + RANDOM.nextInt(501);
        }


        // --------------------------------------------------------
        // MOVE TO NEXT CAMERA
        // --------------------------------------------------------

        void moveToNextCamera() {

            routePosition++;


            /*
             * When the route ends, start the route again.
             *
             * This allows the simulator to run forever.
             */
            if (routePosition >= route.length) {

                routePosition = 0;
            }


            /*
             * New camera = new local track ID.
             *
             * This is important for testing
             * cross-camera vehicle matching.
             */
            localTrackId =
                    1000 + RANDOM.nextInt(9000);


            /*
             * Change speed after entering new camera.
             */
            updateSpeed();
        }
    }


    // ============================================================
    // 5. VEHICLE LIST
    // ============================================================

    private static final List<SimulatedVehicle> vehicles =
            new ArrayList<>();


    // ============================================================
    // 6. MAIN
    // ============================================================

    public static void main(String[] args) {

        printHeader();


        createVehicles();


        System.out.println(
                "Vehicles       : " + vehicles.size()
        );


        System.out.println(
                "Send interval  : "
                        + SEND_INTERVAL_SECONDS
                        + " seconds"
        );


        System.out.println(
                "Event IDs      : UUID based - always unique"
        );


        System.out.println();


        System.out.println(
                "======================================================"
        );


        System.out.println(
                "Simulation started."
        );


        System.out.println(
                "It will continue until you press STOP."
        );


        System.out.println(
                "======================================================"
        );


        System.out.println();


        /*
         * Single scheduler.
         *
         * Runs every 3 seconds.
         */
        ScheduledExecutorService scheduler =
                Executors.newScheduledThreadPool(1);


        scheduler.scheduleAtFixedRate(

                TrafficSimulator::simulationCycle,

                0,

                SEND_INTERVAL_SECONDS,

                TimeUnit.SECONDS
        );


        /*
         * If an unexpected shutdown occurs,
         * stop the scheduler cleanly.
         */
        Runtime.getRuntime().addShutdownHook(
                new Thread(
                        () -> {

                            System.out.println();

                            System.out.println(
                                    "TrafficIQ Simulator stopped."
                            );

                            scheduler.shutdown();
                        }
                )
        );
    }


    // ============================================================
    // 7. HEADER
    // ============================================================

    private static void printHeader() {

        System.out.println();

        System.out.println(
                "======================================================"
        );

        System.out.println(
                "              TrafficIQ ML Simulator"
        );

        System.out.println(
                "======================================================"
        );

        System.out.println();

        System.out.println(
                "Backend:"
        );

        System.out.println(
                BACKEND_URL
        );

        System.out.println();

        System.out.println(
                "Camera range:"
        );

        System.out.println(
                "CAM_001 -> CAM_010"
        );

        System.out.println();
    }


    // ============================================================
    // 8. CREATE VEHICLES
    // ============================================================

    private static void createVehicles() {

        vehicles.clear();


        // ========================================================
        // VEHICLE 1
        // ========================================================
        //
        // WB12AB1234
        //
        // CAM_001
        //    ↓
        // CAM_002
        //    ↓
        // CAM_003
        //    ↓
        // CAM_004
        //    ↓
        // CAM_005
        //
        // ========================================================

        vehicles.add(
                new SimulatedVehicle(

                        "WB12AB1234",

                        "CAR",

                        new String[]{
                                "CAM_001",
                                "CAM_002",
                                "CAM_003",
                                "CAM_004",
                                "CAM_005"
                        },

                        1001,

                        45.0
                )
        );


        // ========================================================
        // VEHICLE 2
        // ========================================================
        //
        // WB34CD5678
        //
        // CAM_003
        //    ↓
        // CAM_004
        //    ↓
        // CAM_005
        //    ↓
        // CAM_006
        //    ↓
        // CAM_007
        //
        // ========================================================

        vehicles.add(
                new SimulatedVehicle(

                        "WB34CD5678",

                        "BIKE",

                        new String[]{
                                "CAM_003",
                                "CAM_004",
                                "CAM_005",
                                "CAM_006",
                                "CAM_007"
                        },

                        2001,

                        38.0
                )
        );


        // ========================================================
        // VEHICLE 3
        // ========================================================
        //
        // WB06EF9012
        //
        // CAM_005
        //    ↓
        // CAM_006
        //    ↓
        // CAM_007
        //    ↓
        // CAM_008
        //    ↓
        // CAM_009
        //
        // ========================================================

        vehicles.add(
                new SimulatedVehicle(

                        "WB06EF9012",

                        "CAR",

                        new String[]{
                                "CAM_005",
                                "CAM_006",
                                "CAM_007",
                                "CAM_008",
                                "CAM_009"
                        },

                        3001,

                        52.0
                )
        );


        // ========================================================
        // VEHICLE 4
        // ========================================================
        //
        // WB20GH3456
        //
        // CAM_007
        //    ↓
        // CAM_008
        //    ↓
        // CAM_009
        //    ↓
        // CAM_010
        //
        // ========================================================

        vehicles.add(
                new SimulatedVehicle(

                        "WB20GH3456",

                        "TRUCK",

                        new String[]{
                                "CAM_007",
                                "CAM_008",
                                "CAM_009",
                                "CAM_010"
                        },

                        4001,

                        42.0
                )
        );


        // ========================================================
        // VEHICLE 5
        // ========================================================
        //
        // WB18JK7890
        //
        // CAM_001
        //    ↓
        // CAM_003
        //    ↓
        // CAM_005
        //    ↓
        // CAM_007
        //    ↓
        // CAM_009
        //
        // ========================================================

        vehicles.add(
                new SimulatedVehicle(

                        "WB18JK7890",

                        "BUS",

                        new String[]{
                                "CAM_001",
                                "CAM_003",
                                "CAM_005",
                                "CAM_007",
                                "CAM_009"
                        },

                        5001,

                        35.0
                )
        );
    }


    // ============================================================
    // 9. SIMULATION CYCLE
    // ============================================================

    private static void simulationCycle() {

        System.out.println();

        System.out.println(
                "================ SIMULATION CYCLE ================"
        );


        /*
         * Send one detection for each vehicle.
         */
        for (SimulatedVehicle vehicle : vehicles) {


            /*
             * Update ML-like changing values.
             */
            vehicle.updateSpeed();

            vehicle.updateFrame();

            vehicle.updateSourceVideoTimestamp();


            /*
             * IMPORTANT:
             *
             * Take a snapshot BEFORE moving the vehicle.
             *
             * This prevents asynchronous response logging
             * from showing the wrong camera.
             */
            DetectionSnapshot snapshot =
                    createSnapshot(vehicle);


            /*
             * Create JSON from snapshot.
             */
            String json =
                    createMlJson(snapshot);


            /*
             * Send JSON.
             */
            sendToBackend(
                    snapshot,
                    json
            );


            /*
             * ONLY AFTER creating/sending the current
             * camera detection, move to next camera.
             */
            vehicle.moveToNextCamera();
        }
    }


    // ============================================================
    // 10. DETECTION SNAPSHOT
    // ============================================================

    /*
     * Immutable snapshot of exactly what was sent.
     *
     * This fixes the old logging problem where the vehicle
     * moved to another camera before the HTTP response returned.
     */
    static class DetectionSnapshot {

        final String eventId;

        final String timestamp;

        final String cameraId;

        final int localTrackId;

        final String plate;

        final String vehicleType;

        final double vehicleConfidence;

        final double candidate1Confidence;

        final double candidate2Confidence;

        final double candidate3Confidence;

        final double speed;

        final String direction;

        final long frameNumber;

        final long sourceVideoTimestampMs;


        DetectionSnapshot(

                String eventId,

                String timestamp,

                String cameraId,

                int localTrackId,

                String plate,

                String vehicleType,

                double vehicleConfidence,

                double candidate1Confidence,

                double candidate2Confidence,

                double candidate3Confidence,

                double speed,

                String direction,

                long frameNumber,

                long sourceVideoTimestampMs

        ) {

            this.eventId = eventId;

            this.timestamp = timestamp;

            this.cameraId = cameraId;

            this.localTrackId = localTrackId;

            this.plate = plate;

            this.vehicleType = vehicleType;

            this.vehicleConfidence = vehicleConfidence;

            this.candidate1Confidence =
                    candidate1Confidence;

            this.candidate2Confidence =
                    candidate2Confidence;

            this.candidate3Confidence =
                    candidate3Confidence;

            this.speed = speed;

            this.direction = direction;

            this.frameNumber = frameNumber;

            this.sourceVideoTimestampMs =
                    sourceVideoTimestampMs;
        }
    }


    // ============================================================
    // 11. CREATE SNAPSHOT
    // ============================================================

    private static DetectionSnapshot createSnapshot(
            SimulatedVehicle vehicle
    ) {

        /*
         * UUID guarantees uniqueness even if:
         *
         * - simulator is restarted
         * - simulator is run multiple times
         * - old event IDs exist in database
         */
        String eventId =
                "evt-"
                        + UUID.randomUUID();


        /*
         * Current real timestamp.
         */
        String timestamp =
                Instant.now().toString();


        /*
         * Vehicle confidence.
         */
        double vehicleConfidence =
                randomConfidence(
                        0.85,
                        0.99
                );


        /*
         * Plate candidates:
         *
         * Highest confidence = real plate.
         *
         * Lower confidence = OCR alternatives.
         */
        double candidate1Confidence =
                randomConfidence(
                        0.90,
                        0.99
                );


        double candidate2Confidence =
                randomConfidence(
                        0.65,
                        0.89
                );


        double candidate3Confidence =
                randomConfidence(
                        0.35,
                        0.64
                );


        return new DetectionSnapshot(

                eventId,

                timestamp,

                vehicle.getCurrentCamera(),

                vehicle.getLocalTrackId(),

                vehicle.getPlate(),

                vehicle.getVehicleType(),

                vehicleConfidence,

                candidate1Confidence,

                candidate2Confidence,

                candidate3Confidence,

                vehicle.getSpeed(),

                getDirection(
                        vehicle.getVehicleType()
                ),

                vehicle.getFrameNumber(),

                vehicle.getSourceVideoTimestampMs()
        );
    }


    // ============================================================
    // 12. CREATE EXACT ML JSON
    // ============================================================

    private static String createMlJson(
            DetectionSnapshot data
    ) {

        /*
         * OCR candidate 1:
         *
         * Correct plate.
         */
        String candidate1 =
                data.plate;


        /*
         * OCR candidate 2:
         */
        String candidate2 =
                createOcrVariation(
                        data.plate,
                        1
                );


        /*
         * OCR candidate 3:
         */
        String candidate3 =
                createOcrVariation(
                        data.plate,
                        2
                );


        /*
         * Exact JSON structure required by
         * TrafficIQ ML ingestion.
         */
        return "{"

                // ==================================================
                // EVENT
                // ==================================================

                + "\"eventId\":\""
                + data.eventId
                + "\","

                + "\"eventType\":\"vehicle_anpr\","

                + "\"cameraId\":\""
                + data.cameraId
                + "\","

                + "\"timestamp\":\""
                + data.timestamp
                + "\","

                + "\"localTrackId\":"
                + data.localTrackId
                + ","


                // ==================================================
                // VEHICLE
                // ==================================================

                + "\"vehicle\":{"

                + "\"type\":\""
                + data.vehicleType
                + "\","

                + "\"typeConfidence\":"
                + format(data.vehicleConfidence)
                + ","

                + "\"bbox\":{"

                + "\"x1\":100,"

                + "\"y1\":200,"

                + "\"x2\":300,"

                + "\"y2\":400"

                + "}"

                + "},"


                // ==================================================
                // PLATE
                // ==================================================

                + "\"plate\":{"

                + "\"candidates\":["


                // --------------------------------------------------
                // CANDIDATE 1
                // --------------------------------------------------

                + "{"

                + "\"data\":\""
                + candidate1
                + "\","

                + "\"confidence\":"
                + format(
                data.candidate1Confidence
        )
                + ","

                + "\"formatValid\":true,"

                + "\"stateCode\":\"WB\","

                + "\"stateAutoCorrected\":false"

                + "},"


                // --------------------------------------------------
                // CANDIDATE 2
                // --------------------------------------------------

                + "{"

                + "\"data\":\""
                + candidate2
                + "\","

                + "\"confidence\":"
                + format(
                data.candidate2Confidence
        )
                + ","

                + "\"formatValid\":true,"

                + "\"stateCode\":\"WB\","

                + "\"stateAutoCorrected\":false"

                + "},"


                // --------------------------------------------------
                // CANDIDATE 3
                // --------------------------------------------------

                + "{"

                + "\"data\":\""
                + candidate3
                + "\","

                + "\"confidence\":"
                + format(
                data.candidate3Confidence
        )
                + ","

                + "\"formatValid\":true,"

                + "\"stateCode\":\"WB\","

                + "\"stateAutoCorrected\":false"

                + "}"

                + "]"

                + "},"


                // ==================================================
                // SPEED
                // ==================================================

                + "\"speed\":{"

                + "\"valueKmh\":"
                + format(data.speed)
                + ","

                + "\"estimated\":true,"

                + "\"direction\":\""
                + data.direction
                + "\""

                + "},"


                // ==================================================
                // PLATE BBOX
                // ==================================================

                + "\"plateBbox\":{"

                + "\"x1\":150,"

                + "\"y1\":300,"

                + "\"x2\":250,"

                + "\"y2\":350"

                + "},"


                // ==================================================
                // FRAME
                // ==================================================

                + "\"frameNumber\":"
                + data.frameNumber
                + ","


                // ==================================================
                // SOURCE VIDEO TIME
                // ==================================================

                + "\"sourceVideoTimestampMs\":"
                + data.sourceVideoTimestampMs

                + "}";
    }


    // ============================================================
    // 13. SEND TO RENDER
    // ============================================================

    private static void sendToBackend(

            DetectionSnapshot data,

            String json

    ) {

        try {

            HttpRequest request =

                    HttpRequest.newBuilder()

                            .uri(
                                    URI.create(
                                            BACKEND_URL
                                    )
                            )

                            .timeout(
                                    Duration.ofSeconds(120)
                            )

                            .header(
                                    "Content-Type",
                                    "application/json"
                            )

                            .POST(
                                    HttpRequest
                                            .BodyPublishers
                                            .ofString(json)
                            )

                            .build();


            /*
             * Async request.
             *
             * This means one slow Render request doesn't
             * completely stop the simulator.
             */
            HTTP_CLIENT

                    .sendAsync(
                            request,
                            HttpResponse
                                    .BodyHandlers
                                    .ofString()
                    )

                    .thenAccept(
                            response ->
                                    printResponse(
                                            data,
                                            response,
                                            json
                                    )
                    )

                    .exceptionally(
                            error -> {

                                printRequestError(
                                        data,
                                        error
                                );

                                return null;
                            }
                    );

        } catch (Exception e) {

            System.out.println();

            System.out.println(
                    "❌ REQUEST CREATION ERROR"
            );

            System.out.println(
                    "Event     : "
                            + data.eventId
            );

            System.out.println(
                    "Camera    : "
                            + data.cameraId
            );

            System.out.println(
                    "Error     : "
                            + e.getMessage()
            );
        }
    }


    // ============================================================
    // 14. PRINT RESPONSE
    // ============================================================

    private static void printResponse(

            DetectionSnapshot data,

            HttpResponse<String> response,

            String json

    ) {

        System.out.println();

        System.out.println(
                "------------------------------------------------------"
        );


        System.out.println(
                "Event ID      : "
                        + data.eventId
        );


        System.out.println(
                "Vehicle       : "
                        + data.plate
        );


        System.out.println(
                "Type          : "
                        + data.vehicleType
        );


        /*
         * IMPORTANT:
         *
         * This is the camera that was actually sent.
         */
        System.out.println(
                "Camera        : "
                        + data.cameraId
        );


        /*
         * This is the localTrackId actually sent.
         */
        System.out.println(
                "Local Track   : "
                        + data.localTrackId
        );


        System.out.println(
                "HTTP Status   : "
                        + response.statusCode()
        );


        if (response.statusCode() >= 200
                && response.statusCode() < 300) {

            System.out.println(
                    "Result        : ✅ SUCCESS"
            );

        } else {

            System.out.println(
                    "Result        : ❌ FAILED"
            );
        }


        System.out.println(
                "Backend Reply : "
                        + response.body()
        );


        if (PRINT_JSON) {

            System.out.println(
                    "JSON Sent     : "
                            + json
            );
        }


        System.out.println(
                "------------------------------------------------------"
        );
    }


    // ============================================================
    // 15. REQUEST ERROR
    // ============================================================

    private static void printRequestError(

            DetectionSnapshot data,

            Throwable error

    ) {

        System.out.println();

        System.out.println(
                "------------------------------------------------------"
        );

        System.out.println(
                "❌ NETWORK / REQUEST ERROR"
        );

        System.out.println(
                "Event         : "
                        + data.eventId
        );

        System.out.println(
                "Vehicle       : "
                        + data.plate
        );

        System.out.println(
                "Camera        : "
                        + data.cameraId
        );

        System.out.println(
                "Error         : "
                        + error.getMessage()
        );

        System.out.println(
                "------------------------------------------------------"
        );
    }


    // ============================================================
    // 16. RANDOM CONFIDENCE
    // ============================================================

    private static double randomConfidence(

            double minimum,

            double maximum

    ) {

        return minimum
                + RANDOM.nextDouble()
                * (maximum - minimum);
    }


    // ============================================================
    // 17. FORMAT DECIMAL
    // ============================================================

    private static String format(
            double value
    ) {

        return String.format(
                Locale.US,
                "%.2f",
                value
        );
    }


    // ============================================================
    // 18. OCR VARIATION
    // ============================================================

    private static String createOcrVariation(

            String plate,

            int variation

    ) {

        if (plate == null
                || plate.length() < 4) {

            return plate;
        }


        char[] chars =
                plate.toCharArray();


        if (variation == 1) {

            /*
             * Change final character.
             *
             * WB12AB1234
             * →
             * WB12AB1238
             */
            chars[chars.length - 1] =
                    chars[chars.length - 1] == '8'
                            ? '9'
                            : '8';

        } else {

            /*
             * Change second-last character.
             */
            chars[chars.length - 2] =
                    chars[chars.length - 2] == '0'
                            ? '1'
                            : '0';
        }


        return new String(chars);
    }


    // ============================================================
    // 19. DIRECTION
    // ============================================================

    private static String getDirection(
            String vehicleType
    ) {

        return switch (vehicleType) {

            case "CAR" ->
                    "NORTH";

            case "BIKE" ->
                    "EAST";

            case "TRUCK" ->
                    "SOUTH";

            case "BUS" ->
                    "WEST";

            default ->
                    "NORTH";
        };
    }
}