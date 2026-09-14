# traffIQ Architecture

## Overview

traffIQ is designed as a **distributed, hierarchical traffic intelligence system** that transforms observations from a city-wide CCTV/ANPR network into unified vehicle trajectories and traffic analytics.

The architecture is divided into four major layers:

1. **Edge Layer** — processes individual camera feeds and produces structured vehicle events.
2. **Regional Backend** — processes and correlates observations within a geographic region.
3. **Global Backend** — correlates information across regions and performs city-wide analytics.
4. **GIS Dashboard** — presents real-time and historical traffic intelligence.

```text
┌───────────────────────────────────────────────┐
│                 EDGE LAYER                    │
│                                               │
│ Camera → Detection → Tracking → ANPR → Events │
│                       ↓                       │
│                Local inference                │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│              REGIONAL BACKEND                 │
│                                               │
│ Ingestion → Validation → Identity Resolution  │
│                     ↓                         │
│          Regional Trajectories                │
│                     ↓                         │
│           Regional Analytics                  │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                GLOBAL BACKEND                 │
│                                               │
│ Cross-region correlation                      │
│ City-wide trajectories                        │
│ OD analysis                                   │
│ Congestion                                    │
│ Anomaly detection                             │
│ Aggregated traffic trends                     │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
                  GIS DASHBOARD
```

---

## 1. Edge Layer

The edge layer is responsible for converting raw camera feeds into structured observations.

Each camera is associated with an AI processing unit responsible for its local video stream.

```text
Camera
  │
  ▼
Vehicle Detection
  │
  ▼
Object Tracking
  │
  ▼
Plate Detection / ANPR
  │
  ▼
Event Generation
```

The edge layer performs **local inference** so that the rest of the system does not need to process every raw video stream.

A generated event may contain:

* Camera identifier
* Timestamp
* Plate information and confidence
* Local track identifier
* Vehicle type or attributes
* Estimated speed
* Direction
* Camera location
* Detection metadata

The edge layer therefore acts primarily as the system's **perception layer**.

---

## 2. Regional Backend

Cameras are grouped geographically into regions.

The regional backend receives structured events from cameras within its region.

```text
Region
 │
 ├── Camera A
 ├── Camera B
 ├── Camera C
 └── Camera D
        │
        ▼
Regional Backend
```

Its primary responsibilities are:

```text
Ingestion
    ↓
Validation
    ↓
Identity Resolution
    ↓
Regional Trajectory Reconstruction
    ↓
Regional Analytics
```

### Ingestion

Receives vehicle observations from edge nodes through the event-streaming layer.

### Validation

Checks event structure, timestamps, confidence values, camera identifiers, and other required metadata.

### Identity Resolution

Determines whether observations from different cameras represent the same vehicle.

Initially this can rely heavily on ANPR results. More advanced correlation can incorporate:

* Temporal constraints
* Spatial distance
* Direction
* Vehicle attributes
* Recognition confidence

### Regional Trajectories

Correlated observations are organized into vehicle trajectories within the region.

---

## 3. Global Backend

Regional backends provide processed observations and trajectories to the global backend.

The global layer is responsible for **city-wide correlation and intelligence**.

```text
Regional A ──┐
Regional B ──┼──► Global Backend
Regional C ──┘
```

Its responsibilities include:

* Cross-region vehicle correlation
* City-wide trajectory reconstruction
* Origin-destination analysis
* Traffic congestion analysis
* Anomaly detection
* Aggregated traffic trends
* City-wide traffic statistics

The global backend provides a unified view of vehicle movement across the entire monitored network.

---

## 4. Data Flow

The overall data flow is:

```text
Raw Video
   │
   ▼
Edge AI
   │
   ▼
Structured Vehicle Events
   │
   ▼
Event Stream
   │
   ▼
Regional Processing
   │
   ▼
Regional Trajectories
   │
   ▼
Global Correlation
   │
   ▼
City-Wide Traffic Intelligence
   │
   ▼
GIS Dashboard
```

The architecture separates **perception**, **correlation**, and **analytics**, allowing each layer to process information at an appropriate level of abstraction.

---

# City-Wide Deployment Model

A city-wide deployment can be divided into multiple geographic regions.

```text
                         CITY-WIDE CCTV / ANPR NETWORK
                                      │
                 ┌────────────────────┼───────────────────────┐
                 │                    │                       │
                 ▼                    ▼                       ▼
          REGION A               REGION B                  REGION C
        100 Cameras            100 Cameras               100 Cameras
                 │                    │                       │
                 ▼                    ▼                       ▼
          ┌───────────┐          ┌───────────┐          ┌───────────┐
          │ EDGE AI   │          │ EDGE AI   │          │ EDGE AI   │
          │   UNIT    │          │   UNIT    │          │   UNIT    │
          └─────┬─────┘          └─────┬─────┘          └─────┬─────┘
                │                      │                      │
                │ Structured           │ Structured           │ Structured
                │ Events               │ Events               │ Events
                ▼                      ▼                      ▼
          ┌─────────────────────────────────────────────────────────┐
          │                 REGIONAL BACKENDS                       │
          │                                                         │
          │ Ingestion → Validation → Identity → Trajectory →        │
          │                          Analytics                      │
          └──────────────────────────┬──────────────────────────────┘
                                     │
                          Regional data / trajectories
                                     │
                                     ▼
          ┌─────────────────────────────────────────────────────────┐
          │                    GLOBAL BACKEND                       │
          │                                                         │
          │ Cross-Region Correlation                                │
          │        ↓                                                │
          │ City-Wide Trajectory Reconstruction                     │
          │        ↓                                                │
          │ Global Traffic Analytics                                │
          │        ↓                                                │
          │ Anomaly / Alert Engine                                  │
          └──────────────────────────┬──────────────────────────────┘
                                     │
                          APIs / WebSocket / Queries
                                     │
                                     ▼
          ┌─────────────────────────────────────────────────────────┐
          │                    GIS WEB DASHBOARD                    │
          │                                                         │
          │ Live Traffic │ Vehicle Search │ Trajectories            │
          │ Heatmaps     │ OD Patterns    │ Congestion              │
          │ Alerts       │ Historical Data│ Analytics               │
          └─────────────────────────────────────────────────────────┘
```

---

## Data and Communication

The system uses **structured events** as the primary interface between processing layers.

Raw video is primarily handled by the edge processing layer, while downstream systems operate on structured vehicle observations and derived traffic information.

An event-streaming system provides asynchronous communication between components, while persistent storage maintains vehicle, camera, trajectory, and analytical data.

The architecture is therefore based on:

```text
Video
  ↓
Observations
  ↓
Events
  ↓
Trajectories
  ↓
Analytics
```

---

## Processing Responsibilities

| Layer             | Primary responsibility                                  |
| ----------------- | ------------------------------------------------------- |
| **Edge**          | Video processing and vehicle perception                 |
| **Regional**      | Local identity resolution and trajectory reconstruction |
| **Global**        | Cross-region correlation and city-wide analytics        |
| **Database**      | Persistent traffic and vehicle data                     |
| **Event Stream**  | Inter-service event transport                           |
| **GIS Dashboard** | Visualization and user interaction                      |

---

## Future Edge Deployment

The project can support different physical deployment models.

The current architecture can use centralized GPU infrastructure for AI processing:

```text
Camera → Central AI Processing → Regional Backend
```

A future deployment can move inference to dedicated hardware near individual cameras:

```text
Camera → Edge AI Unit → Regional Backend
```

The logical architecture remains the same because both approaches produce the same structured **vehicle observation events**.

This allows the AI processing strategy to evolve without fundamentally changing the regional, global, or visualization layers.
