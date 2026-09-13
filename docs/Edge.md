# Edge Infrastructure

The edge layer is responsible for converting raw CCTV video into structured vehicle observations.

Its primary purpose is to perform the computationally intensive computer-vision and ANPR operations as close to the camera source as practical, while exposing a standardized event interface to the regional backend.

The edge pipeline can be deployed in two ways:

* **Current architecture:** AI processing runs on centralized GPU infrastructure and receives video from the camera network.
* **Future deployment:** AI processing runs on dedicated edge AI hardware attached to or located near camera installations.

The processing pipeline remains the same in both cases.

---

## 1. Edge Architecture

```text
              CAMERA MONITORING CENTER
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
       Camera 1       Camera 2       Camera N
          │              │              │
          └──────────────┼──────────────┘
                         │
                         ▼
                ┌────────────────┐
                │ Video Ingestion│
                └───────┬────────┘
                        │
                        ▼
                ┌────────────────┐
                │ Frame Sampling │
                │ / Buffering    │
                └───────┬────────┘
                        │
                        ▼
                ┌────────────────┐
                │ Pre-processing │
                └───────┬────────┘
                        │
             ┌──────────┴──────────┐
             │                     │
             ▼                     ▼
       Vehicle Detection      Plate Detection
             │                     │
             ▼                     ▼
          Tracking             Plate Crop
             │                     │
             └──────────┬──────────┘
                        ▼
                 ANPR Pipeline
                        │
                        ▼
                Speed / Direction
                        │
                        ▼
                Event Generation
                        │
                        ▼
                 Backend / Stream
```

The output of the edge layer is **not raw video**. It is a stream of structured events describing vehicles and their observations.

---

# 2. Camera Monitoring

The edge system may receive streams from multiple CCTV cameras.

Each camera should have a unique identifier.

```text
Camera
├── Camera ID
├── Video source
├── Location
├── Direction / orientation
├── Resolution
├── Frame rate
├── Stream status
└── Calibration parameters
```

Example:

```json
{
  "cameraId": "K017",
  "latitude": 22.5726,
  "longitude": 88.3639,
  "direction": "NORTH",
  "resolution": "1920x1080",
  "fps": 25
}
```

Camera metadata is important because a vehicle observation without spatial and temporal context has limited value for city-wide trajectory reconstruction.

---

# 3. Video Ingestion

The video-ingestion component connects to the camera stream and converts it into frames that can be processed by the AI pipeline.

Typical sources include:

* RTSP CCTV streams
* IP cameras
* Recorded video
* Local video files
* Test streams
* Simulator/replay sources

```text
Camera
   │
   │ RTSP / Video
   ▼
Video Ingestion
   │
   ├── Decode
   ├── Timestamp
   ├── Validate
   └── Buffer
   │
   ▼
Video Frames
```

The ingestion layer should isolate camera-specific protocols from the rest of the computer-vision pipeline.

The detection and tracking components should therefore operate on a generic frame interface rather than directly interacting with RTSP.

---

# 4. Frame Sampling and Buffering

Processing every frame at the camera's native frame rate is often unnecessary.

For example, a camera may produce:

```text
1920 × 1080
25 FPS
```

while the detection pipeline may only require a smaller processing rate.

The frame-processing layer therefore controls:

* Sampling rate
* Frame buffering
* Frame timestamps
* Dropped frames
* Processing queues
* Backpressure

```text
             VIDEO STREAM
                  │
                  ▼
          ┌───────────────┐
          │ Frame Buffer  │
          └───────┬───────┘
                  │
             Sampling
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
       t₁        t₂        t₃
```

Tracking can operate between detection frames, depending on the selected tracking strategy.

This allows the system to reduce GPU utilization without necessarily losing useful vehicle movement information.

---

# 5. Pre-processing

Frames may require preprocessing before being passed to detection models.

Possible operations include:

* Resize
* Crop
* Perspective correction
* Noise reduction
* Brightness adjustment
* Contrast enhancement
* Normalization
* Region-of-interest extraction

```text
Input Frame
     │
     ▼
Resize / Crop
     │
     ▼
Image Normalization
     │
     ▼
Optional Enhancement
     │
     ▼
AI Models
```

Preprocessing should be configurable per camera because different cameras may have significantly different:

* Lighting
* Mounting heights
* Viewing angles
* Road geometry
* Resolution
* Exposure characteristics

---

# 6. Vehicle Detection

Vehicle detection identifies objects of interest in each processed frame.

A YOLO-based detector can be used to identify classes such as:

* Car
* Motorcycle
* Bus
* Truck
* Van
* Other relevant road vehicles

```text
                    VIDEO FRAMES
                         │
                         ▼
                ┌─────────────────┐
                │ YOLO Detection  │
                └────────┬────────┘
                         │
                         ▼
                 Vehicle Detections
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Vehicle 1      Vehicle 2      Vehicle N
```

Each detection contains information such as:

```text
Bounding Box
Class
Detection Confidence
Frame Timestamp
```

Example:

```json
{
  "class": "car",
  "confidence": 0.94,
  "bbox": [820, 340, 1120, 650],
  "timestamp": "2026-09-13T10:04:22.120Z"
}
```

Vehicle detection establishes **what is present in a frame**.

It does not establish whether the same vehicle appeared in previous frames.

That is the responsibility of tracking.

---

# 7. Object Tracking

The tracker associates detections across consecutive frames.

This creates a temporary identity called a **local track ID**.

```text
                    VIDEO FRAMES
                         │
                         ▼
                ┌─────────────────┐
                │ YOLO Detection  │
                └────────┬────────┘
                         │
               Detected Vehicles
                         │
                         ▼
                ┌─────────────────┐
                │ Object Tracker  │
                │                 │
                │ Track ID        │
                │ Bounding Box    │
                │ Position        │
                │ Movement        │
                └────────┬────────┘
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Vehicle 1   Vehicle 2   Vehicle N
          Track #17   Track #18   Track #19
             │           │           │
             ▼           ▼           ▼
          Movement    Movement    Movement
          History     History     History
```

Possible tracking implementations include:

* ByteTrack
* BoT-SORT

A local track may contain:

```text
Track #17
├── Current bounding box
├── Previous positions
├── Velocity estimate
├── Direction
├── First seen timestamp
├── Last seen timestamp
├── Detection confidence
└── Associated plate observations
```

### Local Track ID vs Global Vehicle Identity

A local track ID is valid only within the processing context of a camera.

For example:

```text
Camera K017
    Track #17
```

does not mean that:

```text
Camera K021
    Track #17
```

is the same vehicle.

Cross-camera identity resolution is performed by the backend using observations such as:

* License plate
* Timestamp
* Camera location
* Vehicle attributes
* Direction
* Expected travel time
* Confidence

---

# 8. Plate Detection

License-plate detection identifies the plate region inside a vehicle image.

```text
                    VEHICLE IMAGE
                         │
                         ▼
                ┌─────────────────┐
                │ Plate Detector  │
                └────────┬────────┘
                         │
                         ▼
                   Plate Bounding
                      Region
                         │
                         ▼
                     Crop Plate
                         │
                         ▼
                   Alignment /
                   Normalization
                         │
                         ▼
                  Plate Processing
```

The plate detector should operate on the vehicle region where possible rather than unnecessarily processing the entire frame.

This reduces computational cost and can improve localization accuracy.

---

# 9. Plate Image Processing

The raw plate crop may not be directly suitable for OCR.

Problems may include:

* Motion blur
* Low illumination
* Glare
* Compression artifacts
* Perspective distortion
* Small plate size
* Noise
* Dirty plates
* Partial occlusion

The pipeline therefore generates multiple representations of the plate.

```text
                         PLATE CROP
                             │
             ┌───────────────┼────────────────┐
             │               │                │
             ▼               ▼                ▼
          RAW IMAGE      IMAGE PROCESSING   SUPER-RES
                             │                │
                 ┌───────────┼──────────┐     │
                 │           │          │     │
                 ▼           ▼          ▼     ▼
              Sharpen     Contrast    Edge   SR
              /Denoise    Adjust      Detect
                 │           │          │     │
                 └───────────┼──────────┘     │
                             │                │
                             └───────┬────────┘
                                     ▼
                           MULTIPLE PLATE
                              REPRESENTATIONS
```

Super-resolution should be treated as an auxiliary representation rather than a guaranteed recovery of missing plate information.

The system should retain the original crop as evidence.

---

# 10. Character Recognition

The processed plate representations are passed into the character-recognition pipeline.

A plate can be processed as a sequence of characters or through an end-to-end OCR model.

For the character-oriented approach:

```text
                    PLATE IMAGE
                         │
                         ▼
              Character Segmentation
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
          C1            C2            C3 ...
           │             │             │
           ▼             ▼             ▼
     Character Model Character Model Character Model
           │             │             │
           ▼             ▼             ▼
      Candidate +     Candidate +    Candidate +
      Confidence      Confidence     Confidence
```

Each character produces one or more candidate predictions.

Example:

```text
Character 1
W  0.98
M  0.01
V  0.01

Character 2
B  0.97
8  0.02
R  0.01
```

The individual character predictions are then combined into candidate plate strings.

---

# 11. Evidence Aggregation

ANPR should not depend on a single frame or a single OCR result.

A tracked vehicle may produce several useful plate images:

```text
Track #17

Frame 102 → Plate crop A
Frame 106 → Plate crop B
Frame 110 → Plate crop C
Frame 114 → Plate crop D
```

These observations can be combined.

```text
                         PLATE CROP
                             │
             ┌───────────────┼────────────────┐
             │               │                │
             ▼               ▼                ▼
          RAW IMAGE      ENHANCED IMAGE    SUPER-RES
             │               │                │
             └───────────────┼────────────────┘
                             ▼
                    Character Recognition
                             │
                             ▼
                  Character Candidates
                             │
                             ▼
                ┌───────────────────────┐
                │ Evidence Aggregation  │
                │                       │
                │ Per-character scores  │
                │ Cross-input agreement  │
                │ Image quality          │
                └───────────┬───────────┘
                            │
                            ▼
                   Candidate Plate Strings
                            │
                  ┌─────────┼─────────┐
                  ▼         ▼         ▼
                #1        #2        #3
             WB12AB1234 WB12A81234 WB12AB123A
               0.94       0.67       0.41
                            │
                            ▼
                   Plate Recognition Event
```

Evidence aggregation can consider:

* Character confidence
* OCR confidence
* Image quality
* Agreement between frames
* Agreement between preprocessing variants
* Plate detector confidence
* Temporal consistency

This allows the system to produce a ranked set of candidate plate strings rather than blindly trusting a single OCR result.

---

# 12. ANPR Pipeline

The complete ANPR pipeline is therefore:

```text
Vehicle Track
     │
     ▼
Vehicle Image
     │
     ▼
Plate Detection
     │
     ▼
Plate Crop
     │
     ▼
Alignment
     │
     ▼
Image Processing
     │
     ├── Raw
     ├── Enhanced
     └── Super-resolution
     │
     ▼
Character Recognition
     │
     ▼
Candidate Characters
     │
     ▼
Evidence Aggregation
     │
     ▼
Candidate Plate Strings
     │
     ▼
Best Plate + Confidence
```

The result is associated with the local vehicle track.

```text
Track #17
    │
    ├── Vehicle detection
    ├── Movement history
    ├── Plate observations
    └── ANPR result
             │
             ▼
       WB12AB1234
          0.94
```

---

# 13. Speed Estimation

Vehicle speed is estimated from movement over time.

At its simplest:

```text
                 Position at t₁
                        │
                        ▼
                 Position at t₂
                        │
                        └──────────┐
                                   ▼
                             Distance / Time
                                   │
                                   ▼
                             Speed Estimate
```

Conceptually:

```text
speed = distance / time
```

For real CCTV footage, pixel displacement alone does not represent physical distance.

The camera therefore requires geometric calibration, such as:

* Camera intrinsic parameters
* Road-plane geometry
* Homography
* Known reference distances
* Camera mounting information

A calibrated system can transform image coordinates into approximate road coordinates before estimating movement.

Speed should therefore be treated as an **estimate with confidence**, rather than an exact measurement.

---

# 14. Direction Estimation

Direction is derived from the movement vector of a tracked vehicle.

```text
              Position t₁
                   ●
                    \
                     \
                      ● Position t₂
```

The displacement vector provides the vehicle's movement direction.

The system can represent direction as:

```text
NORTH
SOUTH
EAST
WEST
```

or as a continuous vector/bearing.

Example:

```json
{
  "direction": "NORTH",
  "bearing": 4.2
}
```

Direction becomes particularly useful during cross-camera correlation because it constrains which cameras a vehicle could plausibly appear at next.

---

# 15. Vehicle Event Generation

Once vehicle detection, tracking, ANPR, speed and direction processing are complete, the edge pipeline generates a structured event.

```text
Tracked Vehicle
       │
       ├── Camera
       ├── Timestamp
       ├── Track ID
       ├── Plate
       ├── Vehicle type
       ├── Position
       ├── Speed
       └── Direction
              │
              ▼
       Vehicle Observation
              │
              ▼
       Event Generation
```

Example:

```json
{
  "cameraId": "K017",
  "timestamp": "2026-09-13T10:04:22.120Z",
  "localTrackId": 184,
  "plate": "WB12AB1234",
  "plateConfidence": 0.96,
  "vehicleType": "car",
  "speed": 42.3,
  "direction": "NORTH",
  "latitude": 22.5726,
  "longitude": 88.3639
}
```

This is the primary interface between the AI processing layer and the backend.

---

# 16. Observation Lifecycle

A single vehicle observation can be viewed as:

```text
Camera Frame
     │
     ▼
Vehicle Detection
     │
     ▼
Local Track
     │
     ▼
Vehicle Region
     │
     ├───────────────┐
     │               │
     ▼               ▼
Plate Detection   Movement
     │               │
     ▼               ├── Position
ANPR               ├── Speed
     │               └── Direction
     │
     └───────────────┐
                     ▼
              Evidence Fusion
                     │
                     ▼
             Vehicle Observation
                     │
                     ▼
                Event Stream
```

---

# 17. Event Transport

The edge processing layer should communicate with the backend using structured events rather than continuously transmitting processed video whenever possible.

```text
AI Pipeline
    │
    ▼
VehicleObservation
    │
    ▼
Event Producer
    │
    ▼
Redpanda / Kafka-compatible Stream
    │
    ▼
Regional Backend
```

The event transport layer should support:

* Asynchronous delivery
* Buffering
* Retry
* Ordering where required
* Backpressure
* Partitioning
* Replay
* Multiple consumers

The primary topic can be:

```text
vehicle-observations
```

---

# 18. Temporary Local Buffer

A production edge deployment should not immediately discard an event if the network connection to the regional backend is unavailable.

```text
                    Vehicle Event
                         │
                         ▼
                  Local Event Queue
                         │
                 ┌───────┴───────┐
                 │               │
             Network OK      Network Down
                 │               │
                 ▼               ▼
             Send Event      Store Locally
                                 │
                                 ▼
                           Retry Later
                                 │
                                 ▼
                           Backend
```

This prevents short network failures from causing permanent observation loss.

The buffer can be implemented using a lightweight local persistent queue or embedded storage.

---

# 19. Edge Node Infrastructure

In the future hardware deployment, the processing pipeline can run on a dedicated AI computer associated with one or more cameras.

```text
                  CAMERA
                     │
                     ▼
             ┌────────────────┐
             │ Edge AI Node   │
             │                │
             │ Video Capture  │
             │ YOLO           │
             │ Tracking       │
             │ ANPR           │
             │ Analytics      │
             │ Event Queue    │
             └───────┬────────┘
                     │
             Structured Events
                     │
                     ▼
              Regional Backend
```

A suitable edge node should provide:

* GPU acceleration
* Sufficient RAM
* Local storage
* Ethernet
* Optional cellular connectivity
* Optional GNSS
* Hardware watchdog
* Power-loss recovery
* Thermal management

NVIDIA Jetson-class hardware is a possible deployment target because the computer-vision workload benefits from CUDA/TensorRT acceleration.

The specific hardware is a deployment decision and is not required by the logical edge architecture.

---

# 20. Edge Software Stack

A possible implementation stack is:

| Component           | Technology                        |
| ------------------- | --------------------------------- |
| Video capture       | GStreamer                         |
| Image processing    | OpenCV                            |
| Object detection    | Ultralytics YOLO                  |
| Object tracking     | ByteTrack / BoT-SORT              |
| ANPR                | Custom OCR / PyTorch models       |
| Neural inference    | PyTorch / ONNX Runtime / TensorRT |
| Event serialization | JSON / schema-based format        |
| Event transport     | Redpanda / Kafka                  |
| Local buffering     | Persistent local queue            |
| Runtime             | Python                            |
| Containerization    | Docker                            |

The software should be organized around processing stages rather than tying the entire system into one monolithic function.

---

# 21. Recommended Edge Software Structure

```text
edge/
├── pyproject.toml
├── README.md
├── src/
│   └── traffiq_edge/
│       ├── main.py
│       │
│       ├── capture/
│       │   ├── camera.py
│       │   └── video.py
│       │
│       ├── preprocessing/
│       │   ├── frame.py
│       │   └── enhancement.py
│       │
│       ├── detection/
│       │   ├── vehicle_detector.py
│       │   └── plate_detector.py
│       │
│       ├── tracking/
│       │   └── tracker.py
│       │
│       ├── anpr/
│       │   ├── crop.py
│       │   ├── preprocess.py
│       │   ├── segmentation.py
│       │   ├── ocr.py
│       │   └── aggregation.py
│       │
│       ├── analytics/
│       │   ├── speed.py
│       │   └── direction.py
│       │
│       ├── observation/
│       │   └── builder.py
│       │
│       └── transport/
│           ├── producer.py
│           └── buffer.py
│
└── tests/
```

Each stage should have a clear input/output boundary.

---

# 22. Processing Pipeline

The complete logical pipeline is:

```text
                     CAMERA STREAM
                           │
                           ▼
                  ┌─────────────────┐
                  │ Video Ingestion │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Frame Sampling  │
                  │ / Buffering     │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Pre-processing  │
                  └────────┬────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
      Vehicle Detection         Plate Detection
              │                         │
              ▼                         ▼
          Tracking                 Plate Crop
              │                         │
              │                   ┌─────┴─────┐
              │                   │           │
              │                   ▼           ▼
              │                Processing    OCR
              │                   │           │
              │                   └─────┬─────┘
              │                         │
              └────────────┬────────────┘
                           ▼
                    Evidence Fusion
                           │
                           ▼
                    ANPR Result
                           │
                           ▼
                  Speed / Direction
                           │
                           ▼
                  Event Generation
                           │
                           ▼
                  Local Event Buffer
                           │
                           ▼
                  Redpanda / Backend
```

---

# 23. Resource Management

The edge pipeline is GPU-intensive, so processing must be designed around available compute capacity.

The main resource consumers are:

```text
GPU
├── Vehicle detection
├── Plate detection
├── OCR
└── Optional enhancement / SR

CPU
├── Video decoding
├── Tracking
├── Image processing
├── Event serialization
└── Network handling

RAM
├── Frame buffers
├── Tracking state
├── Model runtime
└── Event queues

Storage
├── Temporary frames
├── Evidence images
├── Logs
└── Offline event queue
```

The system should avoid unnecessarily retaining full-resolution video frames.

Where possible, only the data required for inference, evidence and debugging should be persisted.

---

# 24. Failure Handling

The edge service should assume that individual components can fail.

Examples:

```text
Camera unavailable
       │
       ▼
Retry connection
       │
       ▼
Health status update
```

```text
Backend unavailable
       │
       ▼
Local event buffering
       │
       ▼
Retry
       │
       ▼
Resume transmission
```

```text
GPU inference failure
       │
       ▼
Restart inference worker
       │
       ▼
Resume pipeline
```

A production implementation should include:

* Health checks
* Structured logs
* Watchdog/restart mechanisms
* Camera reconnect logic
* Queue monitoring
* GPU utilization monitoring
* Disk-space monitoring
* Temperature monitoring
* Network monitoring

---

# 25. Privacy and Security

The edge layer processes potentially sensitive vehicle and license-plate information.

Communication with the backend should therefore use authenticated and encrypted channels.

Recommended controls include:

```text
Camera
  │
  ▼
Edge AI
  │
  │ TLS / VPN
  ▼
Regional Backend
```

Additional controls include:

* Device identity
* Mutual authentication where appropriate
* Signed events
* API credentials stored securely
* Role-based access to operational interfaces
* Audit logging
* Configurable data retention
* Restricted access to evidence images
* Secure firmware/software updates

Raw video should not be transmitted or retained unnecessarily when structured observations are sufficient for the application's purpose.

---

# 26. Centralized vs Physical Edge Deployment

The logical processing pipeline does not require physical edge hardware.

### Current deployment

```text
CCTV Cameras
      │
      │ Video
      ▼
Centralized GPU Infrastructure
      │
      ├── Detection
      ├── Tracking
      ├── ANPR
      ├── Speed
      └── Direction
      │
      ▼
Vehicle Observations
      │
      ▼
Regional Backend
```

This is the initial project deployment model because it avoids deploying and maintaining dedicated AI computers at every camera.

### Future deployment

```text
Camera
   │
   ▼
Dedicated Edge AI Node
   │
   ├── Detection
   ├── Tracking
   ├── ANPR
   ├── Speed
   └── Direction
   │
   ▼
Vehicle Observations
   │
   ▼
Regional Backend
```

The future architecture moves inference closer to the camera.

This can provide:

* Lower upstream bandwidth
* Reduced centralized GPU requirements
* Local processing during network interruptions
* Better scalability for very large camera networks
* Failure isolation between cameras

The trade-off is significantly greater hardware, deployment, maintenance and physical infrastructure requirements.

---

# 27. Edge-to-Backend Contract

The most important boundary in the architecture is the observation interface.

```text
                 EDGE
                  │
                  │ VehicleObservation
                  ▼
          ┌─────────────────┐
          │ Regional Backend│
          └─────────────────┘
```

The backend should not depend on how an observation was produced.

It should be possible to provide the same observation through:

```text
Real CCTV
    │
    ▼
Real CV Pipeline
    │
    ▼
VehicleObservation
```

or:

```text
Simulator
    │
    ▼
VehicleObservation
```

or:

```text
Recorded Video
    │
    ▼
Replay Pipeline
    │
    ▼
VehicleObservation
```

This separation allows the AI pipeline and backend to be developed independently.

---

# 28. Final Edge Data Flow

```text
┌─────────────────────────────────────────────────────────────┐
│                       CAMERA LAYER                          │
│                                                             │
│     Camera 1              Camera 2              Camera N    │
└────────┬────────────────────┬────────────────────┬─────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
                     Video Ingestion
                              │
                              ▼
                    Frame Sampling / Buffer
                              │
                              ▼
                       Pre-processing
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        Vehicle Detection            Plate Detection
                │                           │
                ▼                           ▼
             Tracking                   Plate Crop
                │                           │
                │                    Image Processing
                │                           │
                │                           ▼
                │                         OCR
                │                           │
                └──────────────┬────────────┘
                               ▼
                       Evidence Aggregation
                               │
                               ▼
                        ANPR Recognition
                               │
                               ▼
                      Speed / Direction
                               │
                               ▼
                      Event Generation
                               │
                               ▼
                       VehicleObservation
                               │
                               ▼
                     Local Event Buffer
                               │
                               ▼
                    Redpanda / Event Stream
                               │
                               ▼
                       Regional Backend
```

The edge layer therefore acts as the **conversion boundary between unstructured camera video and structured city-wide traffic intelligence**.

Its responsibility ends once reliable, timestamped vehicle observations have been generated and delivered to the backend.
