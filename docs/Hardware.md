# Hardware Architecture & Edge Infrastructure

traffIQ can be deployed with a **dedicated hardware unit at each
camera**.

The purpose of this hardware is not simply to provide more computing
power. A per-camera edge unit changes the system architecture by moving
video processing closer to the source and giving every camera an
independent, monitored compute node.

This provides:

-   localized failure domains
-   reduced dependence on continuous video connectivity
-   lower upstream bandwidth requirements
-   local event buffering
-   better timestamp and location integrity
-   independent health telemetry
-   graceful recovery from software and power failures
-   a path toward large-scale deployment

The hardware layer is a **future deployment architecture** for traffIQ.
The initial project can continue to use centralized GPU infrastructure
while keeping the same AI-to-backend event contract.

------------------------------------------------------------------------

# 1. Hardware Architecture

The basic deployment model is:

``` text
                    ┌─────────────────────────┐
                    │    PER-CAMERA AI UNIT   │
                    │                         │
CCTV ──────────────►│  CPU + GPU/NPU          │
                    │  Local storage          │
                    │  AI processing          │
                    │  GNSS + RTC             │
                    │  Network                │
                    │  Power management       │
                    │  Watchdog               │
                    │  Health monitoring      │
                    └───────────┬─────────────┘
                                │
                         Small event data
                                │
                                ▼
                       Regional Backend
```

Each camera becomes an independently managed edge node.

A city-wide deployment therefore resembles:

``` text
Camera 1 ──► Edge Node 1 ──┐
Camera 2 ──► Edge Node 2 ──┤
Camera 3 ──► Edge Node 3 ──┤
Camera 4 ──► Edge Node 4 ──┤
       ...                  ├──► Regional Backend
Camera N ──► Edge Node N ──┘
```

The regional backend does not need to receive the camera's continuous
raw video under normal operation.

Instead, it receives structured traffic observations and selected
evidence.

------------------------------------------------------------------------

# 2. What the Hardware Solves

## 2.1 Localized Failures

Without dedicated edge nodes, a centralized AI server can become a large
failure domain.

``` text
Central AI Server Failure
          │
          ▼
Many Cameras Affected
```

With per-camera hardware:

``` text
Edge Node 17 Failure
       │
       ▼
Camera 17 Affected

Camera 16 ──► Continue
Camera 18 ──► Continue
Camera 19 ──► Continue
```

A hardware failure is therefore localized to the affected camera or
node.

This does not eliminate failures, but it prevents one compute failure
from automatically becoming a city-wide processing failure.

------------------------------------------------------------------------

# 3. Network Failure Tolerance

Continuous video transmission creates a strong dependency on network
connectivity.

With edge processing:

``` text
Camera
  │
  ▼
Edge AI
  │
  ├── AI processing continues
  │
  └── Network unavailable
          │
          ▼
       Local SSD
          │
          ▼
     Buffer Events
          │
          │ network returns
          ▼
      Upload Events
```

The edge node can continue processing locally even when the connection
to the regional backend is temporarily unavailable.

This is especially useful for:

-   unreliable links
-   temporary outages
-   network congestion
-   maintenance windows
-   intermittent wireless connections

The local node should prioritize preserving structured observations
rather than attempting to indefinitely retain all raw video.

------------------------------------------------------------------------

# 4. Bandwidth Reduction

Raw video is expensive to transport.

For example, a camera producing several Mbps of video can generate a
large continuous network load.

Edge processing changes the normal path from:

``` text
Camera
   │
   │ Continuous Video
   ▼
Central Infrastructure
```

to:

``` text
Camera
   │
   ▼
Edge AI
   │
   │ Small Structured Events
   ▼
Regional Backend
```

A typical observation may contain only:

``` text
Camera ID
Timestamp
Vehicle ID / Local Track ID
Plate Candidates
Confidence
Vehicle Type
Speed
Direction
Position
Quality Metrics
```

This can be dramatically smaller than transmitting continuous video.

Selected images or clips can still be uploaded when required for
evidence or investigation.

------------------------------------------------------------------------

# 5. Local Processing

The edge unit performs the computationally expensive camera-specific
processing.

``` text
Camera
   │
   ▼
Video Capture
   │
   ▼
Frame Processing
   │
   ▼
Vehicle Detection
   │
   ▼
Vehicle Tracking
   │
   ▼
Plate Detection
   │
   ▼
ANPR / OCR
   │
   ▼
Speed + Direction
   │
   ▼
VehicleObservation
```

This keeps the camera processing pipeline close to the video source.

The backend therefore receives the result of computer vision rather than
having to process every camera frame itself.

------------------------------------------------------------------------

# 6. Hardware Components

A practical edge node consists of several functional components.

``` text
┌──────────────────────────────────────────────┐
│                EDGE AI UNIT                  │
│                                              │
│  ┌─────────────┐     ┌──────────────────┐    │
│  │ CPU         │     │ GPU / NPU        │    │
│  │ System      │     │ AI Inference     │    │
│  └─────────────┘     └──────────────────┘    │
│                                              │
│  ┌─────────────┐     ┌──────────────────┐    │
│  │ SSD / eMMC  │     │ RAM              │    │
│  │ Buffer      │     │ Runtime State    │    │
│  └─────────────┘     └──────────────────┘    │
│                                              │
│  ┌─────────────┐     ┌──────────────────┐    │
│  │ GNSS        │     │ Hardware RTC     │    │
│  └─────────────┘     └──────────────────┘    │
│                                              │
│  ┌─────────────┐     ┌──────────────────┐    │
│  │ Network     │     │ Power Protection │    │
│  └─────────────┘     └──────────────────┘    │
│                                              │
│  ┌─────────────┐     ┌──────────────────┐    │
│  │ Watchdog    │     │ Health Telemetry │    │
│  └─────────────┘     └──────────────────┘    │
│                                              │
│              Rugged Enclosure                │
└──────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 7. Compute

The compute subsystem runs the AI pipeline.

It should contain:

-   multicore CPU
-   GPU, NPU, or other AI accelerator
-   sufficient RAM
-   hardware acceleration support
-   thermal management

The accelerator is primarily responsible for neural-network inference.

Potential workloads include:

-   vehicle detection
-   plate detection
-   OCR
-   vehicle classification
-   image enhancement
-   re-identification models
-   future anomaly or behavior models

The CPU handles:

-   video capture
-   pipeline orchestration
-   tracking logic
-   networking
-   buffering
-   health monitoring
-   system management

------------------------------------------------------------------------

# 8. AI Acceleration

The hardware should support optimized inference rather than assuming
that every model will run directly in a training framework.

A possible pipeline is:

``` text
PyTorch Model
      │
      ▼
Model Optimization
      │
      ▼
ONNX / TensorRT
      │
      ▼
GPU / NPU
      │
      ▼
Inference
```

This allows the same AI models to be optimized for the capabilities of
the deployed edge hardware.

The exact accelerator should be selected based on:

-   inference throughput
-   model size
-   power consumption
-   thermal limits
-   memory requirements
-   supported inference runtimes
-   total cost

------------------------------------------------------------------------

# 9. Local Storage

Local storage is one of the most important components of the edge node.

It can be used for:

-   buffered events
-   recent observations
-   selected plate crops
-   evidence images
-   short diagnostic recordings
-   logs
-   system diagnostics
-   model files
-   temporary processing data

The storage hierarchy can be:

``` text
RAM
 │
 ├── Active frames
 ├── Active tracks
 └── Runtime state
 │
 ▼
SSD / eMMC
 │
 ├── Event buffer
 ├── Evidence
 ├── Logs
 └── Temporary media
```

The event buffer should use a persistent queue or append-only storage
mechanism so that events survive application restarts.

------------------------------------------------------------------------

# 10. Event Buffering

When the network is unavailable:

``` text
AI Processing
      │
      ▼
VehicleObservation
      │
      ▼
Local Persistent Queue
      │
      ├── Event 001
      ├── Event 002
      ├── Event 003
      └── ...
```

When connectivity returns:

``` text
Local Queue
     │
     ▼
Connectivity Check
     │
     ▼
Regional Backend
     │
     ▼
Acknowledgement
     │
     ▼
Remove Confirmed Events
```

Events should be acknowledged by the backend before they are permanently
removed from the local buffer.

This provides a basic store-and-forward mechanism.

------------------------------------------------------------------------

# 11. GNSS / GPS

GNSS provides an independent source of:

-   geographic position
-   accurate time
-   synchronization information

The edge node can associate the camera with geographic coordinates and
use GNSS time as an additional synchronization source.

``` text
GNSS
 │
 ├── Position
 │
 └── Time
       │
       ▼
    Edge Node
       │
       ▼
VehicleObservation
```

GNSS is particularly useful when nodes are distributed across a large
geographic area.

The camera's configured location remains authoritative for normal camera
metadata; GNSS can provide additional device positioning and timing
information where appropriate.

------------------------------------------------------------------------

# 12. Hardware RTC

A hardware real-time clock provides time continuity when external
synchronization is temporarily unavailable.

``` text
GNSS / Network Time
        │
        ▼
    Synchronize
        │
        ▼
 Hardware RTC
        │
        │ temporary outage
        ▼
 Continue timestamps
```

This matters because timestamp accuracy is critical to:

-   trajectory reconstruction
-   camera-to-camera travel-time calculation
-   speed estimation
-   event ordering
-   anomaly detection

The RTC should periodically be synchronized against a trusted time
source.

------------------------------------------------------------------------

# 13. Network Interface

The edge node requires reliable communication with the regional
infrastructure.

Possible connectivity includes:

-   Ethernet
-   fiber
-   Wi-Fi where appropriate
-   cellular modem
-   future private wireless networks

A robust node can support more than one connection.

``` text
             Edge Node
                 │
        ┌────────┴────────┐
        ▼                 ▼
     Ethernet          Cellular
        │                 │
        └────────┬────────┘
                 ▼
          Network Manager
```

A secondary cellular link can provide failover when the primary
connection is unavailable.

------------------------------------------------------------------------

# 14. Power Protection

Traffic infrastructure cannot assume perfectly stable power.

The edge unit can therefore include:

-   UPS/battery backup
-   surge protection
-   voltage regulation
-   controlled shutdown
-   automatic startup

Example:

``` text
Power Failure
     │
     ▼
UPS / Battery
     │
     ├── Continue processing
     │
     └── Low battery
            │
            ▼
      Graceful Shutdown
```

After power restoration:

``` text
Power Returns
     │
     ▼
Automatic Startup
     │
     ▼
Health Check
     │
     ▼
AI Services
     │
     ▼
Resume Processing
```

This prevents unnecessary filesystem corruption and reduces manual
intervention.

------------------------------------------------------------------------

# 15. Watchdog

The watchdog provides automatic recovery from software hangs.

``` text
AI Service
    │
    │ heartbeat
    ▼
Watchdog
    │
    ├── Healthy → Continue
    │
    └── No heartbeat
             │
             ▼
          Restart
             │
             ▼
        Health Check
             │
             ▼
       Resume Processing
```

The watchdog can operate at multiple levels:

-   application watchdog
-   service supervisor
-   hardware watchdog

A hardware watchdog is particularly valuable because it can recover the
node even when the operating system or primary process becomes
unresponsive.

------------------------------------------------------------------------

# 16. Health Monitoring and Telemetry

Every edge node should continuously report its health.

Example telemetry:

``` text
Node K017
────────────────────
Status:       ONLINE
CPU:          42%
GPU:          68%
RAM:          71%
Storage:      63%
Temperature:  54°C
FPS:          18
Inference:    31 ms
Queue:        42 events
Network:      87 Mbps
GNSS:         LOCKED
RTC Drift:    < threshold
Uptime:       17 days
```

Telemetry allows the backend to detect degradation before complete
failure.

Important metrics include:

### Compute

-   CPU utilization
-   GPU/NPU utilization
-   memory utilization
-   inference latency
-   processing FPS

### Thermal

-   CPU temperature
-   GPU temperature
-   enclosure temperature
-   thermal throttling state

### Storage

-   capacity
-   free space
-   write errors
-   event queue size

### Network

-   latency
-   packet loss
-   throughput
-   connection state
-   reconnect count

### AI pipeline

-   frames processed
-   vehicles detected
-   plates detected
-   OCR confidence
-   dropped frames
-   inference failures

### System

-   uptime
-   restart count
-   watchdog events
-   service status
-   power state

------------------------------------------------------------------------

# 17. Node Health as a First-Class Event

Health telemetry can use the same general event infrastructure.

``` text
Edge Node
   │
   ├── VehicleObservation
   │
   ├── HealthEvent
   │
   ├── CameraStatusEvent
   │
   └── DiagnosticEvent
          │
          ▼
      Message Bus
          │
          ▼
   Regional Backend
```

This allows the backend to distinguish:

``` text
No vehicle observations
```

from:

``` text
Camera intentionally quiet
```

and:

``` text
Camera / AI node malfunctioning
```

This distinction is essential for reliable traffic analytics.

------------------------------------------------------------------------

# 18. Camera Failure vs AI Failure

The hardware architecture should identify different failure types.

``` text
                    CAMERA NODE
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Camera      AI Unit      Network
          Failure     Failure      Failure
             │           │           │
             ▼           ▼           ▼
          No Video    No Events    Events Buffered
```

These failures produce different telemetry and recovery actions.

For example:

-   camera failure → no usable input
-   AI failure → video may exist but processing stopped
-   network failure → processing continues and events are buffered
-   storage failure → local buffering degraded
-   power failure → node unavailable
-   overheating → processing may be throttled

This makes diagnosis significantly easier than treating every missing
event as the same failure.

------------------------------------------------------------------------

# 19. Redundancy and Backups

The edge node is not intended to be the permanent authoritative storage
location.

Its local storage is primarily a **buffer and temporary evidence
store**.

``` text
                  EDGE NODE
                      │
              ┌───────┴────────┐
              ▼                ▼
        Local Buffer       Selected Evidence
              │                │
              ▼                ▼
       Regional Backend    Object Storage
              │
              ▼
        Global Storage
```

This provides multiple levels of data protection.

If an edge node is physically lost, authoritative regional/global data
should remain available.

If the network fails, the edge node protects recent observations until
connectivity returns.

------------------------------------------------------------------------

# 20. Local Failure Domain

Each edge unit creates a small failure domain.

``` text
               CITY
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
    Region A  Region B  Region C
       │
   ┌───┼───┬───┐
   ▼   ▼   ▼   ▼
  N1  N2  N3  N4
```

If N2 fails:

``` text
N1 ──► Continue
N2 ──► Failed
N3 ──► Continue
N4 ──► Continue
```

The backend can immediately identify the affected camera rather than
inferring a failure from a missing stream somewhere inside a centralized
processing cluster.

------------------------------------------------------------------------

# 21. Security

Edge hardware introduces additional attack surfaces and therefore
requires device-level security.

Important controls include:

-   unique device identity
-   encrypted communication
-   TLS/VPN
-   secure credential storage
-   restricted management access
-   signed software/model updates
-   authenticated backend connections
-   audit logging
-   filesystem permissions
-   secure boot where supported

Conceptually:

``` text
Edge Node
    │
    ├── Device Identity
    ├── Secure Credentials
    ├── Signed Software
    └── Encrypted Channel
              │
              ▼
        Regional Backend
```

A compromised camera node should not automatically provide unrestricted
access to the regional backend.

------------------------------------------------------------------------

# 22. Remote Management

A large deployment cannot depend on physically visiting every camera
whenever a software update is required.

The node should therefore support remote management.

Possible operations include:

-   software updates
-   AI model updates
-   configuration changes
-   service restart
-   health inspection
-   log retrieval
-   diagnostics
-   storage cleanup
-   rollback

A controlled update process should be:

``` text
New Version
    │
    ▼
Backend Validation
    │
    ▼
Edge Deployment
    │
    ▼
Health Check
    │
 ┌──┴──┐
 ▼     ▼
PASS  FAIL
 │     │
 ▼     ▼
Keep  Rollback
```

Updates should be staged rather than deploying a new version to every
node simultaneously.

------------------------------------------------------------------------

# 23. Ruggedization

Outdoor traffic infrastructure may expose hardware to:

-   heat
-   dust
-   rain
-   humidity
-   vibration
-   electrical noise
-   unstable power

The enclosure should therefore provide appropriate:

-   thermal management
-   dust/water protection
-   mechanical protection
-   cable management
-   mounting
-   ventilation or controlled cooling

The exact enclosure rating depends on the installation environment.

------------------------------------------------------------------------

# 24. Example Hardware Configuration

A possible future prototype can use an NVIDIA Jetson-class edge
computer.

One example is:

``` text
┌──────────────────────────────────────┐
│      Jetson-class Edge Computer      │
│                                      │
│  ARM CPU                             │
│  NVIDIA GPU / AI Accelerator         │
│  16 GB-class unified memory          │
│  NVMe / eMMC storage                 │
│  Ethernet                            │
│                                      │
│  + GNSS                              │
│  + Cellular modem                    │
│  + Hardware RTC                      │
│  + UPS                               │
│  + Watchdog                          │
│  + Rugged enclosure                  │
└──────────────────────────────────────┘
```

A system such as the **Seeed reComputer Industrial J4012**, based on the
Jetson Orin NX platform, is one possible reference platform for future
prototyping.

This is an example rather than a fixed production hardware choice.

The production platform should ultimately be selected using actual:

-   camera resolution
-   FPS
-   number of streams
-   ANPR model complexity
-   inference benchmarks
-   thermal measurements
-   power budget
-   deployment cost

------------------------------------------------------------------------

# 25. One Node, One Camera

The simplest deployment model is:

``` text
Camera
   │
   ▼
One Edge AI Unit
   │
   ▼
One Processing Pipeline
```

This makes resource planning and failure isolation straightforward.

However, larger or more capable edge computers could potentially process
multiple cameras.

``` text
              Edge Compute Node
               /      |      \
              ▼       ▼       ▼
           Camera A Camera B Camera C
```

This trades some failure isolation for lower hardware cost.

For traffIQ's conceptual architecture, **one processing node per
camera** is the clearest baseline because it gives each camera an
independent processing and failure domain.

------------------------------------------------------------------------

# 26. Hardware Scaling

A city-wide deployment becomes a collection of independent nodes.

``` text
                 REGIONAL BACKEND
                       ▲
                       │
          ┌────────────┼────────────┐
          │            │            │
       Edge Node     Edge Node    Edge Node
          │            │            │
       Camera        Camera       Camera
```

Adding a camera primarily means adding another edge processing unit.

This provides a relatively linear scaling model for:

-   compute
-   storage
-   camera connectivity
-   health telemetry

The regional backend still needs to scale to accommodate the resulting
event volume.

------------------------------------------------------------------------

# 27. Capacity Planning

The hardware should not be selected based only on theoretical AI
performance.

A node must satisfy the entire workload:

``` text
Video Decode
     +
Frame Processing
     +
Detection
     +
Tracking
     +
Plate Detection
     +
OCR
     +
Image Processing
     +
Encoding / Storage
     +
Networking
     +
Telemetry
```

Performance testing should measure:

-   sustained FPS
-   end-to-end inference latency
-   ANPR throughput
-   maximum concurrent tracks
-   GPU utilization
-   RAM usage
-   storage write rate
-   thermal behavior
-   power consumption

A safety margin should be retained so that temporary traffic peaks do
not immediately overload the node.

------------------------------------------------------------------------

# 28. Graceful Degradation

The edge system should continue providing useful information when
resources become constrained.

Possible degradation sequence:

``` text
Normal
  │
  ▼
Reduce Frame Rate
  │
  ▼
Reduce Optional Processing
  │
  ▼
Prioritize Vehicle / Plate Detection
  │
  ▼
Prioritize Structured Events
  │
  ▼
Buffer Locally
  │
  ▼
Alert Backend
```

For example, expensive optional processing such as high-quality
enhancement can be reduced before basic vehicle detection and event
generation are stopped.

------------------------------------------------------------------------

# 29. Failure Recovery

The complete fault-tolerance model is:

``` text
Network fails
     ↓
Keep processing locally
     ↓
Store events on SSD
     ↓
Network returns
     ↓
Automatically upload buffered events
```

``` text
Power fails
     ↓
Battery / UPS
     ↓
Continue or gracefully shut down
     ↓
Power returns
     ↓
Automatic restart
```

``` text
Software hangs
     ↓
Watchdog detects failure
     ↓
Restart service / node
     ↓
Resume operation
```

``` text
Storage becomes unavailable
     ↓
Raise health alert
     ↓
Continue if possible
     ↓
Use alternate buffer / degraded mode
     ↓
Repair or replace storage
```

------------------------------------------------------------------------

# 30. Edge-to-Backend Contract

Hardware implementation should remain independent from backend
implementation through the standard event contract.

``` text
Camera
   │
   ▼
Edge AI
   │
   │ VehicleObservation
   ▼
Message Bus
   │
   ▼
Regional Backend
```

Example:

``` json
{
  "cameraId": "K017",
  "timestamp": "2026-09-13T10:04:22.120Z",
  "localTrackId": 184,
  "plateCandidates": [
    {
      "plate": "WB12AB1234",
      "confidence": 0.96
    }
  ],
  "vehicleType": "car",
  "speed": 42.3,
  "direction": "NORTH",
  "latitude": 22.5726,
  "longitude": 88.3639,
  "quality": {
    "imageQuality": 0.91,
    "plateQuality": 0.94
  }
}
```

Hardware changes should not require the backend to know which particular
accelerator, CPU, or enclosure produced the event.

------------------------------------------------------------------------

# 31. Hardware Telemetry Contract

In addition to vehicle observations, the node can produce health
information.

Example:

``` json
{
  "nodeId": "EDGE-K017",
  "cameraId": "K017",
  "timestamp": "2026-09-13T10:05:00Z",
  "status": "HEALTHY",
  "cpuUtilization": 0.42,
  "acceleratorUtilization": 0.68,
  "memoryUtilization": 0.71,
  "storageUtilization": 0.63,
  "temperature": 54.0,
  "processingFps": 18.0,
  "queueDepth": 42,
  "networkStatus": "CONNECTED",
  "gnssStatus": "LOCKED",
  "uptimeSeconds": 1468800
}
```

The backend can use this to construct a city-wide infrastructure health
view.

------------------------------------------------------------------------

# 32. Operational Benefits

The hardware architecture provides several important system-level
benefits.

  -----------------------------------------------------------------------
  Problem                 Centralized Processing  Per-Camera Edge
  ----------------------- ----------------------- -----------------------
  Camera video bandwidth  High                    Low upstream event
                                                  bandwidth

  Network outage          Processing interrupted  Local processing
                          unless video path       continues
                          remains available       

  Failure domain          Larger                  Per-node

  Event buffering         Central                 Local + regional

  Timestamp independence  Network dependent       GNSS + RTC support

  Device telemetry        Limited to              Camera/node-level
                          infrastructure          telemetry

  Remote diagnosis        More difficult          Per-node diagnostics

  Power recovery          Infrastructure          Local
                          dependent               UPS/watchdog/startup

  Scaling                 Larger central compute  Add nodes with cameras
                          cluster                 

  Evidence locality       Central                 Recent evidence can be
                                                  retained locally

  Camera-specific         Central configuration   Localized configuration
  calibration                                     
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 33. What the Hardware Does Not Replace

Edge hardware does not eliminate the backend.

The responsibilities remain divided:

``` text
EDGE
├── Video processing
├── Detection
├── Tracking
├── ANPR
├── Movement estimation
├── Event creation
├── Local buffering
└── Health telemetry

REGIONAL BACKEND
├── Validation
├── Identity resolution
├── Regional trajectories
├── Regional analytics
└── Regional storage

GLOBAL BACKEND
├── Cross-region identity
├── City-wide trajectories
├── City-wide analytics
├── OD analysis
├── Anomaly detection
└── Global alerts

FRONTEND
├── GIS
├── Monitoring
├── Investigation
└── Visualization
```

The edge node is therefore a **specialized processing and resilience
layer**, not a replacement for the traffic intelligence platform.

------------------------------------------------------------------------

# 34. Current Project vs Future Hardware Deployment

The initial traffIQ implementation can use centralized AI:

``` text
CCTV
  │
  │ Video
  ▼
Central AI Infrastructure
  │
  │ VehicleObservation
  ▼
Regional Backend
  │
  ▼
Global Backend
  │
  ▼
GIS Dashboard
```

The future deployment can introduce dedicated hardware:

``` text
CCTV
  │
  │ Video
  ▼
Per-Camera Edge AI Unit
  │
  │ VehicleObservation
  ▼
Regional Backend
  │
  ▼
Global Backend
  │
  ▼
GIS Dashboard
```

The AI pipeline and interoperability contract remain conceptually
unchanged.

This allows the project to demonstrate the architecture without
requiring a physical edge device for every camera during the initial
development phase.

------------------------------------------------------------------------

# 35. Complete Hardware Data Flow

``` text
┌──────────────────────┐
│       CCTV           │
│                      │
│   Video Stream       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────┐
│              EDGE AI UNIT                    │
│                                              │
│  Video Capture                               │
│       ↓                                      │
│  Frame Processing                            │
│       ↓                                      │
│  Vehicle Detection                           │
│       ↓                                      │
│  Vehicle Tracking                            │
│       ↓                                      │
│  Plate Detection                             │
│       ↓                                      │
│  ANPR / OCR                                  │
│       ↓                                      │
│  Speed + Direction                           │
│       ↓                                      │
│  Timestamp + Position                        │
│       ↓                                      │
│  VehicleObservation                          │
│       │                                      │
│       ├── Local Event Buffer                 │
│       ├── Evidence Storage                   │
│       ├── Health Telemetry                   │
│       └── Network Transport                  │
└───────────────────────┬──────────────────────┘
                        │
                        │ Events
                        ▼
                 Regional Backend
                        │
                        ▼
                  Global Backend
                        │
                        ▼
                  GIS Dashboard
```

------------------------------------------------------------------------

# 36. Final Hardware Principle

Per-camera edge hardware turns each camera from a passive video source
into an independently managed intelligent sensing node.

``` text
Passive Camera
      │
      │ Video
      ▼
Central Processing
```

becomes:

``` text
Intelligent Camera Node
      │
      ├── Compute
      ├── AI
      ├── Storage
      ├── Time
      ├── Position
      ├── Network
      ├── Power Protection
      ├── Watchdog
      └── Telemetry
             │
             ▼
       Traffic Network
```

The key advantage is not simply **"AI at the camera."**

It is the combination of:

**local computation + local buffering + independent failure domains +
reliable timing + health telemetry + autonomous recovery + low-bandwidth
event transport.**

This makes the hardware architecture suitable for a large distributed
traffic-monitoring system where individual cameras and nodes must
continue operating independently while contributing to a unified
city-wide intelligence platform.
