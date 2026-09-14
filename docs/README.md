# traffIQ

### City-Wide AI Engine for Multi-Camera Vehicle Tracking & Traffic Analytics

**traffIQ** is an AI-powered traffic intelligence platform that connects
isolated CCTV and ANPR cameras into a unified city-wide vehicle tracking and
analytics system.

It uses computer vision and ANPR to identify vehicles, correlate observations
across cameras, reconstruct vehicle trajectories, and provide real-time and
historical traffic insights.

```
                    WHAT THE CAMERA SEES
                           │
                           ▼
                 ┌──────────────────┐
                 │     EDGE AI      │
                 │                  │
                 │ "What is here?"  │
                 └────────┬─────────┘
                          │
                     OBSERVATIONS
                          │
                          ▼
                 ┌──────────────────┐
                 │ REGIONAL BACKEND │
                 │                  │
                 │ "What happened?" │
                 └────────┬─────────┘
                          │
                    TRAJECTORIES
                          │
                          ▼
                 ┌──────────────────┐
                 │  GLOBAL BACKEND  │
                 │                  │
                 │ "What does it    │
                 │  mean?"          │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │   GIS FRONTEND   │
                 │                  │
                 │ "Show it to the  │
                 │  operator."      │
                 └──────────────────┘
```

## Index

| Topic        | Link                    |
| ------------ | ----------------------- |
| Architecture | [Go](./Architecture.md) |
| Technologies | [Go](./Technologies.md) |
| Edge         | [Go](./Edge.md)         |
| Backend      | [Go](./Backend.md)      |
| Frontend     | [Go](./Frontend.md)     |
| InterOp      | [Go](./InterOp.md)      |
| Hardware     | [Go](./Hardware.md)     |
| Budget       | [Go](./Budget.md)       |

## Features

* Multi-camera vehicle tracking
* Automatic Number Plate Recognition (ANPR)
* Cross-camera vehicle correlation
* Vehicle trajectory reconstruction
* Traffic density and congestion analysis
* Vehicle speed and direction estimation
* Origin-destination and traffic-flow analysis
* Real-time traffic visualization
* Blacklisted vehicle and route-anomaly alerts
* GIS-based traffic analytics

## Architecture

```text
CCTV / ANPR Cameras
        │
        ▼
   AI Processing
        │
        ▼
Vehicle Observations
        │
        ▼
    Redpanda
        │
        ▼
 Regional / Global Backend
        │
   ┌────┼────┐
   ▼    ▼    ▼
  DB  Analytics Alerts
        │
        ▼
   Web GIS Dashboard
```

The initial architecture uses **centralized AI processing**, allowing existing camera infrastructure to be used without dedicated hardware at every camera.

A future deployment can move the AI pipeline to dedicated **edge-compute nodes attached to individual cameras**, reducing video bandwidth and central GPU requirements.

## Technology Stack (Tentative)

| Component        | Technology                |
| ---------------- | ------------------------- |
| Backend          | Java, Spring Boot         |
| Computer Vision  | Python, OpenCV, GStreamer |
| Object Detection | YOLO                      |
| Object Tracking  | ByteTrack / BoT-SORT      |
| ANPR / OCR       | OCR pipeline              |
| Event Streaming  | Redpanda                  |
| Database         | PostgreSQL, PostGIS       |
| Cache            | Valkey                    |
| Frontend         | React, TypeScript         |
| Maps             | MapLibre GL JS            |
| API              | REST, WebSocket           |
| Infrastructure   | Docker Compose            |
| Cloud            | AWS                       |

## Repository Structure (Tentative)

```text
traffIQ/
├── backend/           # Backend services
├── edge/              # Computer-vision pipeline
├── simulator/         # Synthetic camera/vehicle data
├── frontend/          # Web GIS dashboard
├── infrastructure/   # Deployment configuration
├── data/              # Datasets and sample media
├── docs/              # Project documentation
├── scripts/           # Utility scripts
├── compose.yaml
├── README.md
└── LICENSE
```

## Vision

**traffIQ turns camera observations into city-wide vehicle intelligence which
provides actionable insights and data with spatiotemporal significance.**

