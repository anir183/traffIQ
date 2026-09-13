# traffIQ Technologies

## Technology Overview

traffIQ combines computer vision, event streaming, backend services, spatial databases, and GIS visualization into a distributed traffic intelligence platform.

```text id="m2f5xk"
┌─────────────────────────────────────────────────────────────────────────┐
│                           CCTV / VIDEO                                  │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            EDGE AI NODE                                 │
│                                                                         │
│  Python + GStreamer / OpenCV                                            │
│  PyTorch / Ultralytics YOLO                                             │
│  ByteTrack / BoT-SORT                                                   │
│  OpenCV image processing                                                │
│  PyTorch custom ANPR / character-recognition model                      │
│  Multi-frame + multi-image evidence fusion                              │
│  Speed estimation + direction detection                                 │
│  ONNX Runtime / TensorRT for optimized inference                        │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                         Structured Events
                         JSON / Protobuf
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EVENT STREAMING LAYER                           │
│                                                                         │
│  Apache Kafka / Redpanda                                                │
│  • Event buffering                                                      │
│  • Partitioning                                                         │
│  • Consumer groups                                                      │
│  • Fault tolerance                                                      │
│  • Event replay                                                         │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                 ┌─────────────────┼─────────────────┐
                 ▼                 ▼                 ▼
       ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
       │ REGIONAL         │ │ REGIONAL         │ │ REGIONAL         │
       │ SPRING BOOT      │ │ SPRING BOOT      │ │ SPRING BOOT      │
       │                  │ │                  │ │                  │
       │ Spring Kafka     │ │ Spring Kafka     │ │ Spring Kafka     │
       │ Event ingestion  │ │ Event ingestion  │ │ Event ingestion  │
       │ Validation       │ │ Validation       │ │ Validation       │
       │ Identity         │ │ Identity         │ │ Identity         │
       │ resolution       │ │ resolution       │ │ resolution       │
       │ Local trajectory │ │ Local trajectory │ │ Local trajectory │
       │ processing       │ │ processing       │ │ processing       │
       └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
                │                    │                    │
                └────────────────────┼────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                 │
│                                                                         │
│  PostgreSQL + PostGIS       → Relational + spatial/trajectory data      │
│  Redis / Valkey             → Active state, cache, recent observations  │
│  MinIO / S3                 → Plate crops, evidence images, media       │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         GLOBAL INTELLIGENCE                             │
│                                                                         │
│  Spring Boot Services                                                   │
│                                                                         │
│  • Cross-region vehicle correlation                                     │
│  • Global trajectory reconstruction                                     │
│  • Camera / road graph analysis                                         │
│  • Traffic density & flow analytics                                     │
│  • Origin-Destination analysis                                          │
│  • Congestion detection                                                 │
│  • Route anomaly detection                                              │
│  • Blacklisted vehicle detection                                        │
│  • Alert / notification engine                                          │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                          ┌────────┴────────┐
                          │                 │
                       REST API         WebSocket
                          │                 │
                          └────────┬────────┘
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            GIS FRONTEND                                 │
│                                                                         │
│  React + TypeScript                                                     │
│  MapLibre GL JS / OpenLayers                                            │
│  REST API                                                               │
│  WebSocket live updates                                                 │
│                                                                         │
│  • Vehicle trajectories                                                 │
│  • Camera locations                                                     │
│  • Traffic heatmaps                                                     │
│  • Congestion                                                           │
│  • OD flows                                                             │
│  • Alerts                                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Edge AI

### Python

**Used for:** Computer-vision and AI processing.

Python provides the ecosystem required for video processing, machine learning, object detection, tracking, and ANPR experimentation.

It acts as the main language of the **AI pipeline**.

### GStreamer / OpenCV

**Used for:** Video capture and image processing.

* **GStreamer** handles camera/video streams efficiently.
* **OpenCV** provides frame processing, image transformations, geometric calculations, and other computer-vision operations.

Together they form the video-processing foundation.

### PyTorch

**Used for:** Machine-learning inference and custom models.

PyTorch provides the framework for developing and running the project's neural-network models, including custom ANPR and character-recognition components.

### Ultralytics YOLO

**Used for:** Vehicle and license-plate detection.

YOLO provides real-time object detection suitable for identifying vehicles and locating license plates within video frames.

### ByteTrack / BoT-SORT

**Used for:** Multi-object tracking.

Detection identifies objects in individual frames; tracking connects those detections across consecutive frames.

This produces a **local track identity** for vehicles within a camera.

### ANPR / Character Recognition

**Used for:** License-plate recognition.

The ANPR pipeline combines plate detection, image processing and character recognition to produce plate candidates and confidence scores.

A custom PyTorch model can be used where a specialized recognition model provides better control over the target plate format.

### Evidence Fusion

**Used for:** Improving recognition reliability.

Multiple frames and image representations can be considered together rather than relying on a single frame.

This allows the system to combine evidence from repeated observations of the same plate.

### Speed and Direction Estimation

**Used for:** Traffic analysis.

Tracking data and camera calibration can be used to estimate vehicle speed and direction.

These values become part of the structured vehicle observation sent to the backend.

### ONNX Runtime / TensorRT

**Used for:** Optimized inference.

Models can be exported from their development frameworks into optimized inference formats.

* **ONNX Runtime** provides portable optimized inference.
* **TensorRT** provides NVIDIA GPU-specific optimization.

These are primarily deployment optimizations rather than development frameworks.

---

# Event Streaming

## Apache Kafka / Redpanda

**Used for:** Transporting vehicle observations between distributed components.

The AI layer should not directly depend on individual backend instances. Instead, it publishes structured events to an event stream.

```text id="k9p1yt"
AI Node
   │
   ▼
VehicleObservation
   │
   ▼
Kafka / Redpanda
   │
   ├──► Regional Backend A
   ├──► Regional Backend B
   └──► Other consumers
```

The event-streaming layer provides:

* Asynchronous communication
* Event buffering
* Partitioning
* Consumer groups
* Fault tolerance
* Event replay

**Redpanda** is the preferred deployment for the project because it provides a Kafka-compatible streaming interface while fitting well with a comparatively lightweight deployment.

---

# Backend

## Java / Spring Boot

**Used for:** Regional and global backend services.

Spring Boot provides the main application framework for:

* Event ingestion
* Validation
* Identity resolution
* Trajectory processing
* Traffic analytics
* Alert processing
* REST APIs
* WebSocket communication

Java is used here because the backend is primarily a high-throughput application and data-processing layer rather than an ML environment.

### Spring Kafka

**Used for:** Connecting Spring Boot services to Kafka-compatible event streams.

It provides the interface through which regional services consume vehicle observation events.

```text id="g5yl0f"
Redpanda
    │
    ▼
Spring Kafka
    │
    ▼
Spring Boot
```

---

# Data Layer

## PostgreSQL

**Used for:** Primary persistent application data.

PostgreSQL stores structured information such as:

* Vehicles
* Cameras
* Observations
* Trajectories
* Alerts
* Traffic statistics

It provides the transactional and relational foundation of the system.

## PostGIS

**Used for:** Spatial and geographic data.

PostGIS extends PostgreSQL with spatial types and operations.

It allows traffIQ to work directly with:

* Camera coordinates
* Vehicle positions
* Road segments
* Geographic regions
* Trajectory geometries
* Spatial queries

This avoids separating ordinary application data from the geographic data required by the traffic system.

## Redis / Valkey

**Used for:** Fast-access temporary state and caching.

It can store:

* Recent observations
* Active vehicle state
* Frequently accessed data
* Short-lived correlation information
* Cached analytics

Persistent historical data remains in PostgreSQL.

## MinIO / Amazon S3

**Used for:** Object and evidence storage.

Large binary objects such as:

* Plate crops
* Evidence images
* Selected video frames
* Other media

are better suited to object storage than relational database tables.

**MinIO** can be used for local/self-hosted development, while **Amazon S3** can provide the equivalent cloud storage layer.

---

# Global Intelligence

## Spring Boot Services

The global intelligence layer uses the same Spring Boot ecosystem as the regional backend.

Its purpose is not raw video processing, but **reasoning over processed observations and trajectories**.

It handles:

* Cross-region vehicle correlation
* City-wide trajectory reconstruction
* Road and camera graph analysis
* Traffic density and flow
* Origin-destination analysis
* Congestion detection
* Route anomaly detection
* Blacklisted vehicle detection
* Alerts and notifications

The distinction is therefore:

```text id="j7v8iq"
Regional Backend
    ↓
"What happened within this region?"

Global Backend
    ↓
"What does the entire city's traffic look like?"
```

---

# Frontend

## React + TypeScript

**Used for:** Web application and dashboard.

React provides the component-based UI architecture, while TypeScript provides type safety for the frontend code and API models.

## MapLibre GL JS / OpenLayers

**Used for:** GIS visualization.

The mapping layer displays geographic traffic information such as:

* Cameras
* Vehicle locations
* Trajectories
* Heatmaps
* Congestion
* Origin-destination flows
* Alerts

**MapLibre GL JS** is the preferred mapping technology for the main implementation, while OpenLayers is an alternative for applications requiring a different GIS feature set.

## REST API

**Used for:** Standard request/response communication.

The frontend uses REST APIs to request:

* Vehicle information
* Historical trajectories
* Camera information
* Traffic analytics
* Alerts

## WebSocket

**Used for:** Real-time updates.

WebSocket provides persistent communication from the backend to the dashboard for live events such as:

* Vehicle observations
* Traffic changes
* New alerts
* Live analytics

```text id="t1v0lc"
Backend
   │
   ├── REST ────────► Frontend
   │
   └── WebSocket ───► Frontend
```

---

# Infrastructure

## Docker / Docker Compose

**Used for:** Local development and service orchestration.

Docker Compose provides a reproducible environment for infrastructure such as:

```text id="e6kzjo"
PostgreSQL
PostGIS
Redpanda
Valkey
MinIO
```

Application services can subsequently be containerized and deployed using the same service boundaries.

## AWS

**Used for:** Potential production/cloud deployment.

AWS provides infrastructure for centralized GPU processing, backend services, databases, object storage, and networking.

The initial architecture does not depend on AWS and can be developed locally using Docker Compose.

---

# Technology Interaction

The technologies are intentionally separated according to their responsibilities:

```text id="j4v0a1"
                 COMPUTER VISION
                       │
       Python / PyTorch / YOLO / OpenCV
                       │
                       ▼
              VehicleObservation
                       │
                       ▼
                Kafka / Redpanda
                       │
                       ▼
                Spring Boot
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
       PostgreSQL    Valkey     MinIO/S3
        + PostGIS
            │
            ▼
       Global Intelligence
            │
       ┌────┴────┐
       ▼         ▼
    REST      WebSocket
       │         │
       └────┬────┘
            ▼
     React + TypeScript
            │
            ▼
    MapLibre GIS Dashboard
```

The resulting separation allows each technology to be replaced or optimized independently while maintaining the same overall system architecture.

The central interface between the AI and backend layers is the **structured vehicle event**, which decouples computer vision from the rest of the platform.

