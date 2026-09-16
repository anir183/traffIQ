# Backend Infrastructure

The backend is the distributed data and intelligence layer of traffIQ.

It receives structured vehicle observations from edge AI processing, validates and normalizes them, resolves vehicle identities across cameras, reconstructs trajectories, performs regional and city-wide analytics, manages alerts, and provides data to the GIS dashboard.

The backend is divided into two logical levels:

* **Regional Backend** — processes observations within a geographic region and maintains regional operational data.
* **Global Backend** — correlates regional data and maintains city-wide indexes, analytics, historical storage, and alerts.

The architecture is designed so that regional failures do not necessarily bring down the entire city-wide system.

---

# 1. Backend Architecture

```text
                         EDGE AI UNITS
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
            ▼                 ▼                 ▼
        Region A           Region B           Region C
            │                 │                 │
            ▼                 ▼                 ▼
       ┌──────────┐      ┌──────────┐      ┌──────────┐
       │Regional  │      │Regional  │      │Regional  │
       │Backend A │      │Backend B │      │Backend C │
       └────┬─────┘      └────┬─────┘      └────┬─────┘
            │                 │                 │
            ▼                 ▼                 ▼
       Local DB           Local DB           Local DB
            │                 │                 │
            └─────────────────┼─────────────────┘
                              │
                              ▼
                       GLOBAL BACKEND
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
          Global Index   Global Analytics   Alerts
                │             │             │
                └─────────────┼─────────────┘
                              ▼
                       GIS Dashboard
```

The regional layer handles high-volume local processing.

The global layer handles operations that require information from multiple regions.

---

# 2. Regional Backend

Each geographic region operates a regional backend responsible for the cameras and edge units assigned to that region.

```text
Region A
│
├── Camera A1
├── Camera A2
├── Camera A3
└── Camera AN
       │
       ▼
Regional Backend A
       │
       ├── Event Ingestion
       ├── Validation
       ├── Identity Resolution
       ├── Trajectory Reconstruction
       ├── Regional Analytics
       └── Local Storage
```

A region can represent:

* A geographic zone
* A group of intersections
* A traffic-control area
* A municipal subdivision
* Another operational partition

The exact boundaries are deployment-specific.

---

# 3. Event Ingestion

The first backend component receives structured events from the edge layer.

```text
                  EDGE AI EVENTS
                        │
                        ▼
              ┌──────────────────┐
              │ Event Ingestion  │
              │                  │
              │ Message Queue    │
              │ Load Balancing   │
              │ Buffering        │
              └────────┬─────────┘
                       │
                       ▼
                    Consumers
```

The ingestion layer separates incoming event traffic from downstream processing.

The primary transport is a Kafka-compatible event stream such as Redpanda.

Example:

```text
vehicle-observations
```

This allows multiple backend consumers to process the same event stream independently.

For example:

```text
                    vehicle-observations
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
        Validation     Analytics       Monitoring
             │              │              │
             ▼              ▼              ▼
          Storage       Aggregation      Metrics
```

---

# 4. Event Buffering

The event stream acts as a durable buffer between producers and consumers.

```text
Edge AI
   │
   ▼
Event Producer
   │
   ▼
Message Stream
   │
   ├───────────────┐
   │               │
   ▼               ▼
Regional        Analytics
Consumer        Consumer
```

If a consumer becomes temporarily unavailable, events can remain in the stream until processing resumes.

This prevents short backend failures from immediately causing observation loss.

The system should distinguish between:

* **Transport buffering** — events waiting in the message system.
* **Local buffering** — events temporarily stored at an edge node when the regional backend is unreachable.
* **Database storage** — durable application data.
* **Object storage** — large evidence objects such as plate crops or selected images.

---

# 5. Validation and Normalization

Every observation must pass through validation before entering the trusted data layer.

```text
                   OBSERVATION
                        │
                        ▼
                 Schema Validation
                        │
                   ┌────┴────┐
                   │         │
                 FAIL       PASS
                   │         │
                   ▼         ▼
                Reject    Timestamp
                /Flag      Validation
                              │
                              ▼
                       Spatial Validation
                              │
                              ▼
                       Quality Validation
                              │
                              ▼
                       Duplicate Check
                              │
                              ▼
                    Cross-camera Consistency
                              │
                              ▼
                      ┌───────┴───────┐
                      │               │
                    Normal         Suspicious
                      │               │
                      ▼               ▼
                  Continue          Flag
```

Validation includes:

### Schema validation

Checks that required fields exist and have valid types.

```text
cameraId
timestamp
localTrackId
position
```

### Timestamp validation

Checks for:

* Missing timestamps
* Invalid timestamps
* Excessive clock drift
* Future timestamps
* Extremely old events

### Spatial validation

Checks that:

* Camera IDs exist
* Coordinates are valid
* Observations fall within reasonable camera areas
* Geographic values are not malformed

### Quality validation

Checks confidence and quality information from the edge pipeline.

### Duplicate detection

Prevents the same observation from being inserted multiple times.

A suspicious observation should generally be **flagged rather than silently discarded**, allowing it to be investigated or reprocessed.

---

# 6. Identity Resolution

The regional backend converts independent camera observations into candidate vehicle identities.

A plate recognition result is evidence, not necessarily absolute truth.

```text
                  NEW OBSERVATION
                         │
                         ▼
                   Plate Candidates
                         │
                         ▼
              Search Existing Observations
                         │
              ┌──────────┼───────────┐
              │          │           │
              ▼          ▼           ▼
           Plate       Time        Location
           Match       Match        Match
              │          │           │
              └──────────┼───────────┘
                         ▼
                 Candidate Vehicle
                         │
                         ▼
              ┌─────────────────────┐
              │ Consistency Scoring │
              │                     │
              │ Plate similarity    │
              │ Time compatibility  │
              │ Camera connectivity │
              │ Travel time         │
              │ Speed plausibility  │
              └──────────┬──────────┘
                         │
                         ▼
                    Identity Score
                         │
                ┌────────┼────────────────┐
                ▼        ▼                ▼
              Match  Uncertain     New Vehicle
                │      │
                ▼      ▼
             Merge   Retain
             Track  Candidates
```

Identity resolution can use:

* Plate candidates
* Plate confidence
* Temporal proximity
* Camera topology
* Expected travel time
* Direction
* Estimated speed
* Vehicle type
* Vehicle appearance attributes
* Historical observations

The system should retain uncertainty instead of forcing every observation into a single identity.

---

# 7. Regional Trajectory Reconstruction

Once observations are associated with vehicle identities, they can be ordered chronologically.

```text
                  VEHICLE ID
                      │
                      ▼
             Chronological Events
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
      CAM_A         CAM_B         CAM_D
      10:00         10:04         10:11
        │             │             │
        └─────────────┼─────────────┘
                      ▼
              Camera Graph Matching
                      │
                      ▼
               Transition A → B
                      │
                      ▼
               Transition B → D
                      │
                      ▼
              ┌────────────────┐
              │   TRAJECTORY   │
              │                │
              │ A → B → D      │
              │                │
              │ Start: 10:00   │
              │ End:   10:11   │
              │ Distance: ...  │
              │ Avg Speed: ... │
              └────────────────┘
```

The regional backend maintains a camera graph representing plausible transitions.

```text
Camera A ─────→ Camera B
   │                │
   │                ▼
   └───────────→ Camera C
                    │
                    ▼
                 Camera D
```

A transition is evaluated using:

* Physical road connectivity
* Geographic distance
* Direction
* Time difference
* Expected travel time
* Estimated speed
* Traffic conditions

This prevents impossible transitions from being treated as valid trajectories.

---

# 8. Regional Data Model

The regional database stores operational traffic data.

Conceptually:

```text
Camera
  │
  ├── Location
  ├── Configuration
  └── Connectivity
        │
        ▼
Observation
  │
  ├── Vehicle identity
  ├── Timestamp
  ├── Position
  ├── Speed
  ├── Direction
  └── Confidence
        │
        ▼
Vehicle
  │
  └── Trajectory
        │
        ├── Point A
        ├── Point B
        ├── Point C
        └── ...
```

Important logical entities include:

```text
Camera
Observation
Vehicle
VehicleIdentity
Trajectory
TrajectoryPoint
CameraTransition
TrafficAggregate
Alert
```

The exact physical schema can evolve as implementation requirements become clearer.

---

# 9. Local Database

Each regional backend maintains local operational storage.

```text
Regional Backend
       │
       ▼
┌──────────────────────┐
│      Local DB        │
│                      │
│ Cameras              │
│ Observations         │
│ Vehicles             │
│ Trajectories         │
│ Traffic Aggregates   │
│ Regional Alerts      │
└──────────────────────┘
```

PostgreSQL with PostGIS is suitable for this layer.

PostGIS provides spatial operations required for:

* Camera coordinates
* Vehicle positions
* Road segments
* Trajectory geometry
* Geographic distance
* Spatial queries
* GIS visualization

---

# 10. Global Storage

Regional databases are optimized for local operation.

The global layer maintains longer-lived city-wide data and indexes.

```text
Regional DB A ───┐
Regional DB B ───┼──→ Global Data Layer
Regional DB C ───┘
```

The global data layer can contain:

```text
Global
├── Vehicle identities
├── City-wide trajectories
├── Camera graph
├── Historical aggregates
├── Origin-destination data
├── Alert history
├── System events
└── Analytical indexes
```

Not every regional database record needs to be replicated indefinitely into the global operational database.

Instead, the global layer can receive:

* Important observations
* Resolved identities
* Trajectory summaries
* Aggregated traffic data
* Alerts
* Historical records required for city-wide analysis

This reduces unnecessary duplication.

---

# 11. Global Event and Audit Log

The event infrastructure should maintain a durable record of system activity.

```text
                     EVENT STREAM
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
         Processing      Storage      Audit
             │            │            │
             ▼            ▼            ▼
          Results     Historical    Event Log
```

The event log can record:

```text
Event ID
Event type
Source
Timestamp
Region
Camera
Processing status
Correlation ID
Payload/reference
```

Event types may include:

```text
VEHICLE_OBSERVED
PLATE_RECOGNIZED
IDENTITY_RESOLVED
TRAJECTORY_UPDATED
ANOMALY_DETECTED
BLACKLIST_MATCH
ALERT_CREATED
ALERT_RESOLVED
```

The event log provides traceability when investigating how a particular vehicle identity, trajectory, or alert was produced.

---

# 12. Event Replay

One important advantage of the event-driven architecture is replayability.

```text
Historical Event Log
        │
        ▼
      Replay
        │
        ▼
┌───────────────────┐
│ Processing Engine │
└─────────┬─────────┘
          │
          ▼
       New Result
```

This allows the system to:

* Rebuild derived data
* Test updated identity-resolution algorithms
* Recalculate analytics
* Investigate processing errors
* Reprocess historical observations

The original event should therefore remain distinguishable from derived results.

---

# 13. Local Buffers and Failure Recovery

The system should continue operating through temporary network failures.

```text
                 EDGE AI
                    │
                    ▼
              Local Buffer
                    │
                    ▼
             Regional Backend
                    │
             ┌──────┴──────┐
             │             │
          Online        Offline
             │             │
             ▼             ▼
          Process       Keep Buffer
                           │
                           ▼
                       Reconnect
                           │
                           ▼
                       Replay Events
```

Similarly, a regional backend can temporarily buffer events before they reach the global layer.

```text
Regional Backend
       │
       ▼
Regional Queue
       │
       ├── Global available → Send
       │
       └── Global unavailable
                    │
                    ▼
              Retain / Retry
```

This creates multiple recovery boundaries instead of relying on a single always-available network path.

---

# 14. Regional-to-Global Synchronization

Regional systems periodically or continuously publish regional results to the global layer.

```text
Region A ───────┐
Region B ───────┼──→ Global Event Stream
Region C ───────┘
                         │
                         ▼
                 Global Correlation
```

Global processing can then combine information from different regions.

For example:

```text
Region A
   │
   ▼
Vehicle observed at 10:00
   │
   │
   ▼
Region B
Vehicle observed at 10:08
   │
   │
   ▼
Region C
Vehicle observed at 10:17
```

The global layer can determine that these observations represent one city-wide journey.

---

# 15. Global Vehicle Identity

Regional identities are not necessarily globally unique.

The global layer maintains the city-wide identity representation.

```text
Regional Vehicle A
        │
        │
Regional Vehicle B ───→ Global Vehicle ID
        │
        │
Regional Vehicle C
```

The global identity system can merge regional observations using:

* Plate evidence
* Temporal relationships
* Geographic relationships
* Camera graph
* Regional trajectory information
* Vehicle attributes
* Historical evidence

This produces a city-wide vehicle history.

---

# 16. Global Trajectory

Regional trajectories can be combined into a larger city-wide trajectory.

```text
Region A
  │
  └── Camera A1
          │
          ▼
Region B
  │
  └── Camera B4
          │
          ▼
Region C
  │
  └── Camera C2
```

Result:

```text
Global Vehicle
       │
       ▼
A1 → B4 → C2
       │
       ▼
City-wide Trajectory
```

The trajectory can contain:

```text
Vehicle ID
Start time
End time
Camera sequence
Geographic path
Distance
Average speed
Travel time
Region transitions
Confidence
```

---

# 17. Traffic Analytics

Vehicle observations and trajectories are converted into traffic statistics.

```text
                  VEHICLE EVENTS
                       │
                       ▼
                 Data Aggregation
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Vehicle       Segment       Camera
       Counts        Speeds        Counts
          │            │            │
          └────────────┼────────────┘
                       ▼
              Time-Series Aggregation
                       │
          ┌────────────┼──────────────┐
          ▼            ▼              ▼
       Density      Average Speed   Flow Rate
          │            │              │
          └────────────┼──────────────┘
                       ▼
               Traffic Intelligence
```

Traffic analytics can be calculated at different spatial scales:

```text
Camera
  ↓
Road Segment
  ↓
Intersection
  ↓
Region
  ↓
City
```

And different temporal scales:

```text
Seconds
Minutes
Hours
Days
Weeks
Months
```

---

# 18. Origin-Destination Analysis

City-wide trajectories enable origin-destination analysis.

```text
                  VEHICLE TRAJECTORIES
                          │
                          ▼
                   Determine Origin
                          │
                          ▼
                 Determine Destination
                          │
                          ▼
                    Group Vehicles
                          │
                          ▼
                      OD Matrix
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
           Zone A       Zone B       Zone C
              │           │           │
              └──────┬────┴────┬──────┘
                     ▼         ▼
                 Flow Counts / Percentages
                          │
                          ▼
                  GIS Flow Visualization
```

An OD matrix represents movement between geographic zones.

Example:

```text
             Destination
           A      B      C
Origin A   -     420     95
       B  310     -     180
       C   72    205      -
```

This can reveal:

* Major traffic corridors
* Peak movement directions
* Regional bottlenecks
* Changes in traffic patterns
* Frequently used routes

---

# 19. Congestion Detection

Traffic measurements are compared against historical or configured baselines.

```text
                    TRAFFIC DATA
                         │
             ┌───────────┼────────────┐
             ▼           ▼            ▼
          Density       Speed       Volume
             │           │            │
             └───────────┼────────────┘
                         ▼
                 Historical Baseline
                         │
                         ▼
                  Congestion Model
                         │
                    ┌────┴────┐
                    ▼         ▼
                  Normal   Congested
                    │         │
                    ▼         ▼
                 Continue  Generate Event
                              │
                              ▼
                           Alert /
                         Dashboard
```

A congestion model may consider:

* Average speed
* Vehicle density
* Flow rate
* Road capacity
* Historical traffic
* Time of day
* Day of week
* Spatial extent

The initial implementation can use threshold-based rules before introducing more sophisticated predictive models.

---

# 20. Anomaly Detection

The backend can compare new observations against expected physical and historical behavior.

```text
                     OBSERVATION
                          │
                          ▼
                  Historical Context
                          │
             ┌────────────┼────────────┐
             │            │            │
             ▼            ▼            ▼
         Plate Error   Time Error   Route Error
             │            │            │
             └────────────┼────────────┘
                          ▼
                  Physical Plausibility
                          │
                          ▼
                  Historical Pattern
                          │
                          ▼
                   Anomaly Score
                          │
                    ┌─────┴─────┐
                    ▼           ▼
                 Normal      Suspicious
                    │           │
                    ▼           ▼
                 Store       Alert Engine
```

Potential anomalies include:

* Impossible travel time
* Impossible speed
* Unexpected camera transition
* Inconsistent plate observations
* Unusual route
* Repeated suspicious movement
* Sudden deviations from expected traffic patterns

An anomaly should be treated as a probabilistic signal rather than automatic proof of wrongdoing.

---

# 21. Blacklist and Alert Processing

Recognized plates can be checked against an authorized watchlist.

```text
                 RECOGNIZED PLATE
                        │
                        ▼
                 Normalize Plate
                        │
                        ▼
                  Blacklist DB
                        │
                 ┌──────┴──────┐
                 ▼             ▼
               Match         No Match
                 │             │
                 ▼             ▼
              ALERT         Continue
                 │
                 ▼
          Alert Management
                 │
                 ▼
             Dashboard
```

An alert record should contain sufficient context for investigation.

```text
Alert
├── Alert ID
├── Alert type
├── Vehicle identity
├── Plate candidate
├── Confidence
├── Camera
├── Region
├── Timestamp
├── Evidence reference
├── Status
└── Created / updated time
```

Alerts can have states such as:

```text
NEW
ACKNOWLEDGED
INVESTIGATING
RESOLVED
FALSE_POSITIVE
```

---

# 22. Global Storage Architecture

A large-scale deployment should separate different classes of data rather than storing everything in one database.

```text
                         GLOBAL DATA
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   Operational DB       Event Storage       Object Storage
          │                   │                   │
          │                   │                   ├── Plate crops
          │                   │                   ├── Evidence
          │                   │                   └── Media
          │                   │
          │                   ├── Raw events
          │                   ├── Processing events
          │                   └── Audit events
          │
          ├── Vehicles
          ├── Trajectories
          ├── Alerts
          └── Metadata
```

Possible technologies:

| Data                        | Technology                                               |
| --------------------------- | -------------------------------------------------------- |
| Operational relational data | PostgreSQL/PostGIS                                       |
| Event stream                | Redpanda                                                 |
| Cache / transient state     | Valkey                                                   |
| Large objects               | S3 / MinIO                                               |
| Historical analytics        | PostgreSQL initially; analytical store later if required |

The project does not need every storage technology from the beginning. The architecture separates the responsibilities so that storage can evolve independently.

---

# 23. Object Storage

Images and other large binary objects should not normally be embedded directly into relational database rows.

Instead:

```text
Plate Crop
    │
    ▼
Object Storage
    │
    ▼
Object Reference
    │
    ▼
Observation
```

An observation can contain:

```json
{
  "observationId": "obs-18492",
  "plate": "WB12AB1234",
  "evidence": [
    "object://evidence/2026/09/13/obs-18492.jpg"
  ]
}
```

Object storage can contain:

* Original plate crops
* Enhanced plate crops
* Selected vehicle images
* Alert evidence
* Diagnostic artifacts

Retention policies should determine how long these objects remain available.

---

# 24. Cache and Active State

Not every piece of data needs to be read from PostgreSQL for every operation.

Valkey can maintain short-lived operational state.

```text
Regional / Global Backend
          │
          ├──────────────→ PostgreSQL
          │
          └──────────────→ Valkey
                               │
                               ├── Active tracks
                               ├── Recent observations
                               ├── Temporary correlations
                               ├── Hot vehicle lookups
                               └── Dashboard cache
```

Cache data should be treated as reconstructable state.

The database and event system remain the authoritative sources.

---

# 25. Backend Services

The backend can initially be implemented as a modular Spring Boot application rather than immediately splitting every component into separate microservices.

Logical modules include:

```text
backend/
├── ingestion/
├── validation/
├── vehicle/
├── camera/
├── identity/
├── trajectory/
├── analytics/
├── alert/
├── storage/
├── realtime/
└── api/
```

As deployment requirements grow, individual high-load components can be separated into independent services.

This avoids introducing unnecessary distributed-system complexity during initial development.

---

# 26. API Layer

The backend exposes APIs for applications such as the GIS dashboard.

Example endpoints:

```http
GET /api/cameras
GET /api/cameras/{id}

GET /api/vehicles
GET /api/vehicles/{plate}
GET /api/vehicles/{plate}/trajectory

GET /api/traffic
GET /api/traffic/density
GET /api/traffic/congestion
GET /api/traffic/flow

GET /api/alerts
GET /api/alerts/{id}
```

The API layer should expose derived information rather than requiring the frontend to understand the internal event-processing architecture.

---

# 27. Real-Time Updates

The dashboard can receive live changes through WebSocket connections.

```text
Edge AI
   │
   ▼
Redpanda
   │
   ▼
Backend Processing
   │
   ▼
WebSocket
   │
   ▼
GIS Dashboard
```

Example live events:

```text
Vehicle observed
Trajectory updated
Congestion changed
Alert generated
Camera status changed
```

The WebSocket layer should therefore be considered a presentation interface, not the primary event transport.

---

# 28. Distributed Failure Model

The architecture is designed around independent failure domains.

```text
Camera Failure
     │
     ▼
Other Cameras Continue
```

```text
Regional Backend Failure
     │
     ▼
Other Regions Continue
```

```text
Global Backend Failure
     │
     ▼
Regional Processing Continues
     │
     ▼
Regional Data / Events Retained
     │
     ▼
Global Recovery
```

This is one of the main reasons for maintaining regional processing and storage instead of sending every operation directly into a single global database.

---

# 29. Replication and Recovery

Important regional and global databases should support appropriate replication and backups.

Conceptually:

```text
             PRIMARY DATABASE
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
     Replica / HA        Backup Storage
          │                   │
          │                   └── Historical backup
          │
          ▼
     Failover Instance
```

Backups should cover:

* Operational database
* Configuration
* Camera metadata
* Vehicle identity information
* Alert history
* Important analytical data

The event log provides an additional recovery mechanism because derived state can potentially be rebuilt from retained events.

---

# 30. Observability

The backend must monitor both application health and data-processing health.

```text
                    BACKEND
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     Metrics          Logs          Traces
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                 Monitoring System
```

Important metrics include:

```text
Events received / second
Events processed / second
Queue lag
Validation failures
Duplicate rate
Identity-resolution latency
Trajectory processing latency
Database latency
Cache hit rate
Storage usage
Alert generation rate
Regional health
Camera connectivity
```

This is especially important in a distributed deployment because a system can remain technically "online" while silently accumulating processing delays.

---

# 31. Complete Backend Data Flow

```text
                         EDGE AI EVENTS
                                │
                                ▼
                       ┌─────────────────┐
                       │ Event Ingestion │
                       │ Queue / Buffer  │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Validation    │
                       │   Normalization │
                       └────────┬────────┘
                                │
                     ┌──────────┴──────────┐
                     │                     │
                     ▼                     ▼
                Regional DB          Event Log
                     │
                     ▼
             Identity Resolution
                     │
                     ▼
            Trajectory Reconstruction
                     │
                     ▼
              Regional Analytics
                     │
                     ▼
                Regional Data
                     │
                     ▼
              Regional Event Stream
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
    Global Correlation     Global Storage
          │                     │
          ▼                     ├── Vehicles
    City-wide Identity          ├── Trajectories
          │                     ├── Alerts
          ▼                     └── Aggregates
    City-wide Trajectory
          │
     ┌────┼──────────────┐
     ▼    ▼              ▼
     OD  Congestion   Anomaly
     │      │            │
     └──────┼────────────┘
            ▼
      Global Analytics
            │
      ┌─────┴──────┐
      ▼            ▼
   Alert Engine   GIS APIs
      │            │
      ▼            ▼
    Alerts      Dashboard
```

---

# 32. Backend Responsibilities

The backend is responsible for turning independent observations into persistent and queryable traffic intelligence.

```text
Raw Structured Events
        │
        ▼
Validation
        │
        ▼
Identity Resolution
        │
        ▼
Trajectory Reconstruction
        │
        ▼
Regional Analytics
        │
        ▼
Global Correlation
        │
        ▼
City-wide Analytics
        │
        ├── Traffic Intelligence
        ├── Origin-Destination
        ├── Congestion
        ├── Anomaly Detection
        └── Alerts
        │
        ▼
GIS Dashboard
```

The core principle is:

> **Events are the durable stream of observations; databases maintain operational and derived state; regional systems provide locality and resilience; the global layer provides city-wide correlation and intelligence.**

This separation allows traffIQ to scale from a small development deployment to a distributed city-wide system without changing the fundamental data flow.
