# Interoperability & System Integration

traffIQ is composed of several logical systems that operate at different
levels of the traffic infrastructure.

The interoperability layer defines how these systems exchange
information and how raw camera data becomes city-wide traffic
intelligence.

The core principle is:

> **Each layer performs a specific transformation and communicates with
> the next layer through a well-defined data contract.**

``` text
CCTV Cameras
     │
     │ Video
     ▼
AI Processing
     │
     │ VehicleObservation events
     ▼
Regional Backend
     │
     │ Regional intelligence
     ▼
Global Backend
     │
     │ APIs / WebSocket
     ▼
GIS Dashboard
```

------------------------------------------------------------------------

# 1. System Levels

The system is divided into four major levels.

``` text
┌─────────────────────────────────────────────┐
│                 GIS DASHBOARD               │
│       Visualization / Investigation         │
└───────────────────────▲─────────────────────┘
                        │ API / WebSocket
┌───────────────────────┴─────────────────────┐
│                GLOBAL BACKEND               │
│      City-wide correlation and analytics    │
└───────────────────────▲─────────────────────┘
                        │ Regional Data
┌───────────────────────┴─────────────────────┐
│               REGIONAL BACKEND              │
│ Validation / Identity / Trajectories / Data │
└───────────────────────▲─────────────────────┘
                        │ Structured Events
┌───────────────────────┴─────────────────────┐
│                  AI LAYER                   │
│ Detection / Tracking / ANPR / Movement      │
└───────────────────────▲─────────────────────┘
                        │ Video
┌───────────────────────┴─────────────────────┐
│                 CCTV NETWORK                │
└─────────────────────────────────────────────┘
```

The current project can run AI processing centrally. In a future
deployment, the same AI processing pipeline can run on dedicated edge AI
units near the cameras.

The interoperability contracts remain the same.

------------------------------------------------------------------------

# 2. CCTV Camera Level

CCTV cameras are the primary data source.

A camera provides a video stream containing vehicles, road conditions,
and surrounding traffic activity.

``` text
CCTV CAMERAS
│
├── Camera 1
├── Camera 2
├── Camera 3
└── Camera N
       │
       │ VIDEO
       ▼
   AI Processing
```

Each camera should have a stable identifier such as:

``` text
cameraId = K017
```

The backend associates this identifier with metadata such as:

-   geographic position
-   road/segment
-   direction of view
-   region
-   camera status
-   calibration information

The camera itself does not need to understand the higher-level traffic
intelligence system.

Its primary responsibility is providing a reliable video source.

------------------------------------------------------------------------

# 3. AI Processing Level

The AI layer converts video into structured vehicle observations.

Conceptually:

``` text
┌─────────────────────────────────────────────┐
│                AI PROCESSING                │
│                                             │
│ Video                                       │
│   │                                         │
│   ▼                                         │
│ Frame Processing                            │
│   │                                         │
│   ▼                                         │
│ Vehicle Detection ─────► Vehicle Tracking   │
│   │                              │          │
│   ▼                              │          │
│ Plate Detection                  │          │
│   │                              │          │
│   ▼                              │          │
│ Plate Recognition                │          │
│   │                              │          │
│   └──────────────┬───────────────┘          │
│                  ▼                          │
│          Speed / Direction                  │
│                  │                          │
│                  ▼                          │
│          Structured Event                   │
└─────────────────────────────────────────────┘
```

The AI layer is deliberately separated from the backend.

The AI system does not need to know how a city-wide trajectory is
reconstructed. It only needs to produce reliable observations describing
what it saw.

------------------------------------------------------------------------

# 4. Vehicle Track → Structured Event

A vehicle track is the fundamental unit connecting the computer-vision
components.

``` text
       VEHICLE TRACK
            │
            ├───────────────┐
            │               │
            ▼               ▼
       Plate Result     Movement Data
            │               │
            │          ┌────┴─────┐
            │          │          │
            │        Speed     Direction
            │
            ▼
      Confidence Data
            │
            ▼
      ┌───────────────────────┐
      │ STRUCTURED EVENT      │
      │                       │
      │ Camera ID             │
      │ Timestamp             │
      │ Local Track ID        │
      │ Plate Candidates      │
      │ Confidence            │
      │ Vehicle Type          │
      │ Speed                 │
      │ Direction             │
      │ Position              │
      │ Quality Metrics       │
      └───────────┬───────────┘
                  │
                  ▼
             MESSAGE BUS
                  │
                  ▼
            REGIONAL BACKEND
```

This structured event is the primary interoperability contract between
AI processing and backend infrastructure.

------------------------------------------------------------------------

# 5. Complete AI / Edge Pipeline

The complete camera-to-event pipeline is:

``` text
┌──────────────────────┐
│    CCTV CAMERAS      │
│                      │
│  Cam 1 ... Cam N     │
└──────────┬───────────┘
           │
           │ VIDEO
           ▼
┌─────────────────────────────────────────────┐
│              AI PROCESSING                  │
│                                             │
│  Frame Processing                           │
│       │                                     │
│       ▼                                     │
│  Vehicle Detection ──────► Vehicle Tracking │
│       │                        │            │
│       ▼                        │            │
│  Plate Detection               │            │
│       │                        │            │
│       ▼                        │            │
│  ┌─────────────────────────┐   │            │
│  │ Plate Recognition       │   │            │
│  │                         │   │            │
│  │ Raw / Enhanced / SR     │   │            │
│  │        ↓                │   │            │
│  │ Character Segmentation  │   │            │
│  │        ↓                │   │            │
│  │ Character Models        │   │            │
│  │        ↓                │   │            │
│  │ Confidence Ranking      │   │            │
│  │        ↓                │   │            │
│  │ Top 3 Plate Candidates  │   │            │
│  └────────────┬────────────┘   │            │
│               │                │            │
│               └───────┬────────┘            │
│                       ▼                     │
│              Speed / Direction              │
│                       │                     │
│                       ▼                     │
│              Structured Event               │
└───────────────────────┬─────────────────────┘
                        │
                        │ EVENTS
                        ▼
```

The AI pipeline may be deployed:

``` text
Current:
Camera → Network → Central AI Infrastructure

Future:
Camera → Local Edge AI Unit
```

In both cases the output is the same structured event.

------------------------------------------------------------------------

# 6. Message Bus

The message bus decouples AI processing from backend processing.

``` text
AI Producers
     │
     ├── Camera A
     ├── Camera B
     └── Camera N
          │
          ▼
   ┌───────────────┐
   │   Redpanda    │
   │  Message Bus  │
   └───────┬───────┘
           │
           ├──────────────► Regional Consumer
           │
           ├──────────────► Replay / Processing
           │
           └──────────────► Monitoring
```

Redpanda provides the event-streaming boundary between the
observation-producing systems and the backend.

Its responsibilities include:

-   buffering events
-   decoupling producers and consumers
-   handling bursts of observations
-   allowing asynchronous processing
-   supporting event replay
-   providing consumer offsets
-   enabling multiple consumers

The message bus should carry events, not large video files.

Large images and video evidence belong in object storage, with
references included in events where required.

------------------------------------------------------------------------

# 7. Regional Backend Level

The regional backend converts independent observations into regional
traffic intelligence.

``` text
┌─────────────────────────────────────────────┐
│           REGIONAL BACKEND                  │
│                                             │
│  Event Ingestion                            │
│       ↓                                     │
│  Validation / Normalization                 │
│       ↓                                     │
│  Identity Resolution                        │
│       ↓                                     │
│  Camera Graph + Temporal Reasoning          │
│       ↓                                     │
│  Trajectory Reconstruction                  │
│       ↓                                     │
│  Regional Analytics                         │
│       │                                     │
│       ├── Traffic Density                   │
│       ├── Average Speed                     │
│       ├── OD Patterns                       │
│       ├── Congestion                        │
│       └── Regional Trends                   │
└───────────────────────┬─────────────────────┘
                        │
                        │ REGIONAL DATA
                        ▼
```

The regional layer is responsible for turning observations into
meaningful local relationships.

------------------------------------------------------------------------

# 8. Event Ingestion

The regional backend consumes events from the message bus.

``` text
Structured Event
       │
       ▼
   Redpanda
       │
       ▼
Event Consumer
       │
       ▼
Ingestion Service
```

The ingestion layer should:

-   deserialize the event
-   verify the schema
-   identify the source camera
-   assign processing metadata
-   preserve the original event
-   pass valid events to downstream processing

Invalid events should be rejected or flagged rather than silently
discarded.

------------------------------------------------------------------------

# 9. Validation and Normalization

Before an observation participates in identity resolution or trajectory
reconstruction, it is validated.

``` text
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

Validation may include:

-   required fields
-   timestamp validity
-   camera existence
-   geographic validity
-   plate format
-   confidence range
-   speed plausibility
-   duplicate detection
-   event ordering
-   camera-specific constraints

Normalization ensures that different AI producers produce compatible
representations.

------------------------------------------------------------------------

# 10. Identity Resolution

A local track ID only identifies a vehicle within a camera-processing
context.

The regional backend determines whether observations correspond to the
same physical vehicle.

``` text
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
                  ┌──────┼──────┐
                  ▼      ▼      ▼
                Match  Uncertain New Vehicle
                  │      │
                  ▼      ▼
               Merge   Retain
               Track  Candidates
```

Identity resolution should not depend exclusively on exact plate
equality.

Supporting evidence may include:

-   plate similarity
-   plate confidence
-   temporal compatibility
-   camera connectivity
-   geographic distance
-   estimated travel time
-   vehicle attributes
-   movement direction

This makes the system more robust to imperfect ANPR.

------------------------------------------------------------------------

# 11. Camera Graph and Temporal Reasoning

The backend can represent the road-camera network as a graph.

``` text
        Camera A
          │
          │ 4 min
          ▼
        Camera B
        /     \
   6 min       3 min
     /           \
    ▼             ▼
Camera C        Camera D
```

Edges can represent likely transitions between cameras.

For an observation sequence:

``` text
Camera A @ 10:00
      ↓
Camera B @ 10:04
      ↓
Camera D @ 10:07
```

the backend can determine whether the movement is physically plausible.

This provides an important constraint for identity resolution and
anomaly detection.

------------------------------------------------------------------------

# 12. Trajectory Reconstruction

Once observations are associated with a vehicle identity, the backend
constructs a trajectory.

``` text
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

A trajectory may contain:

-   vehicle identity
-   ordered observations
-   cameras visited
-   timestamps
-   positions
-   estimated speeds
-   directions
-   route transitions
-   confidence

------------------------------------------------------------------------

# 13. Regional Storage

The regional backend maintains operational and intermediate data.

``` text
                 REGIONAL BACKEND
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
     Operational DB   Event Data   Local Cache
          │             │             │
          ├── Cameras   │             ├── Active state
          ├── Vehicles  │             ├── Recent events
          ├── Events    │             └── Hot lookups
          └── Tracks    │
                        └── Replay data
```

PostgreSQL/PostGIS is the primary structured datastore.

Object storage can hold large evidence artifacts.

Valkey can hold transient or frequently accessed state.

------------------------------------------------------------------------

# 14. Regional-to-Global Interoperability

The regional backend does not send every internal processing detail to
the global layer.

Instead, it publishes regional intelligence and the information required
for city-wide correlation.

``` text
Regional Backend
       │
       ├── Regional Vehicle Identity
       ├── Observation References
       ├── Regional Trajectory
       ├── Camera / Zone Metadata
       ├── Traffic Aggregates
       └── Regional Events
               │
               ▼
         Global Backend
```

This reduces unnecessary cross-region traffic and keeps regional
processing autonomous.

The exact boundary can evolve as the implementation develops.

------------------------------------------------------------------------

# 15. Global Backend Level

The global backend combines information from multiple regions.

``` text
┌─────────────────────────────────────────────┐
│             GLOBAL BACKEND                  │
│                                             │
│  Cross-Region Identity Correlation          │
│       ↓                                     │
│  Cross-Region Trajectories                  │
│       ↓                                     │
│  City-Wide Analytics                        │
│       │                                     │
│       ├── City Traffic Flow                 │
│       ├── OD Matrix                         │
│       ├── Bottleneck Detection              │
│       ├── Heatmaps                          │
│       └── Historical Trends                 │
│                                             │
│  Alert Engine                               │
│       │                                     │
│       ├── Blacklisted Vehicle               │
│       ├── Route Anomaly                     │
│       ├── Impossible Movement               │
│       └── Suspicious Pattern                │
└───────────────────────┬─────────────────────┘
                        │
                        │ API / WebSocket
                        ▼
```

The global layer is concerned with relationships that cannot be reliably
understood from one region alone.

------------------------------------------------------------------------

# 16. Cross-Region Identity Correlation

A vehicle may move between regional boundaries.

``` text
Region A
Camera A1
   │
   │
   ▼
Camera A5
   │
   │ regional boundary
   ▼
Region B
Camera B2
   │
   ▼
Camera B8
```

The global backend correlates regional identities using:

-   plate candidates
-   confidence
-   timestamps
-   camera locations
-   regional trajectories
-   travel-time constraints
-   vehicle attributes where available

The result is a city-wide vehicle identity and trajectory.

------------------------------------------------------------------------

# 17. City-Wide Trajectory

Regional trajectories can be combined into a larger trajectory.

``` text
REGION A
A1 ──► A2 ──► A5
              │
              ▼
REGION B      B2 ──► B8
                         │
                         ▼
REGION C              C1 ──► C4
```

The global trajectory provides:

-   city-wide route
-   start and end locations
-   regional transitions
-   total travel time
-   estimated distance
-   average movement speed
-   route history

------------------------------------------------------------------------

# 18. City-Wide Traffic Analytics

Global analytics operate over the combined observation and trajectory
dataset.

``` text
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

The resulting intelligence can feed:

-   GIS heatmaps
-   traffic flow maps
-   congestion indicators
-   historical charts
-   road rankings
-   operational alerts

------------------------------------------------------------------------

# 19. Origin-Destination Analysis

Trajectories provide the input for origin-destination analysis.

``` text
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
                     ▼          ▼
                 Flow Counts / Percentages
                          │
                          ▼
                  GIS Flow Visualization
```

OD data can be aggregated to geographic zones rather than exposing
individual vehicle identities.

------------------------------------------------------------------------

# 20. Congestion Detection

Congestion can be derived from multiple traffic signals.

``` text
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

Congestion can therefore be represented as a road-segment state rather
than merely a collection of slow vehicles.

------------------------------------------------------------------------

# 21. Alert Interoperability

The alert engine consumes intelligence produced throughout the system.

``` text
AI / Regional / Global Signals
             │
             ▼
       Alert Evaluation
             │
      ┌──────┼────────┐
      ▼      ▼        ▼
  Blacklist Anomaly  Congestion
      │      │        │
      └──────┼────────┘
             ▼
        Alert Record
             │
             ▼
      Dashboard / API
```

Examples include:

-   blacklisted vehicle detection
-   suspicious route
-   impossible movement
-   abnormal travel time
-   camera failure
-   congestion threshold exceeded

Alerts should retain the evidence and confidence information needed for
investigation.

------------------------------------------------------------------------

# 22. Global Storage

The global system maintains long-term and city-wide information.

``` text
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
          └── Aggregates
```

The architecture separates:

-   structured operational data
-   durable event history
-   large binary evidence
-   transient cached state

This prevents one storage system from being responsible for every
workload.

------------------------------------------------------------------------

# 23. Frontend Interoperability

The frontend consumes processed intelligence rather than raw camera
streams or internal databases.

``` text
Global Backend
      │
      ├──────────────► REST API
      │
      └──────────────► WebSocket
                          │
                          ▼
                    GIS Dashboard
```

REST is suitable for:

-   searches
-   historical data
-   vehicle details
-   trajectories
-   analytics
-   camera information
-   incident details

WebSocket is suitable for:

-   live vehicle observations
-   new alerts
-   camera status changes
-   live traffic changes
-   dashboard updates

------------------------------------------------------------------------

# 24. GIS Data Flow

GIS information is generated at multiple stages.

``` text
Camera Metadata
      │
      ▼
PostGIS
      │
      ├── Camera locations
      ├── Road network
      ├── Vehicle positions
      ├── Trajectories
      ├── Traffic segments
      ├── Incidents
      └── Zones
             │
             ▼
        Spatial APIs
             │
             ▼
          MapLibre
             │
             ▼
        GIS Dashboard
```

The backend should perform spatial filtering and aggregation when
datasets become large.

For example:

``` text
User viewport
     │
     ▼
Spatial query
     │
     ├── Cameras in viewport
     ├── Active vehicles
     ├── Relevant road segments
     └── Visible incidents
     │
     ▼
Frontend
```

------------------------------------------------------------------------

# 25. End-to-End Live Data Flow

The complete live path is:

``` text
CCTV
  │
  │ Video
  ▼
AI Processing
  │
  │ VehicleObservation
  ▼
Redpanda
  │
  ▼
Regional Backend
  │
  ├── Validation
  ├── Identity
  ├── Trajectory
  └── Regional Analytics
  │
  │ Regional Data
  ▼
Global Backend
  │
  ├── Cross-region correlation
  ├── City analytics
  ├── Anomaly detection
  └── Alerts
  │
  │ API / WebSocket
  ▼
GIS Dashboard
  │
  ├── Live Map
  ├── Vehicle Search
  ├── Trajectories
  ├── Traffic
  └── Alerts
```

------------------------------------------------------------------------

# 26. Historical Data Flow

Historical investigation follows a different path.

``` text
User Query
    │
    ▼
Frontend
    │
    ▼
Global API
    │
    ▼
Global Database / Event Storage
    │
    ▼
Trajectory / Analytics Query
    │
    ▼
Processed Result
    │
    ▼
Frontend
    │
    ▼
Map / Table / Chart
```

Historical data does not need to travel through the live message path
again unless an event replay or reprocessing operation is explicitly
requested.

------------------------------------------------------------------------

# 27. Event Replay and Reprocessing

The event architecture also allows historical observations to be
processed again.

``` text
Event Storage
     │
     ▼
Replay
     │
     ▼
Message Bus
     │
     ▼
Processing Pipeline
     │
     ├── New validation
     ├── New identity model
     ├── New trajectory model
     └── New analytics
     │
     ▼
Updated Derived Data
```

This is useful when:

-   an improved ANPR model is introduced
-   identity-resolution logic changes
-   analytics algorithms are improved
-   historical data needs correction
-   a processing failure needs recovery

Raw or authoritative events should therefore be retained separately from
derived results.

------------------------------------------------------------------------

# 28. Failure Interoperability

Each level should fail independently where possible.

``` text
Camera Failure
     │
     ▼
Other Cameras Continue
```

``` text
Regional Backend Failure
     │
     ▼
Other Regions Continue
```

``` text
Global Backend Failure
     │
     ▼
Regional Processing Continues
     │
     ▼
Regional Data Retained
     │
     ▼
Synchronize After Recovery
```

``` text
Dashboard Failure
     │
     ▼
Backend Processing Continues
```

The message bus and regional buffers provide the decoupling required for
this behavior.

------------------------------------------------------------------------

# 29. Synchronization and Recovery

After a temporary global or network failure:

``` text
Regional System
      │
      ├── Continue receiving events
      ├── Store locally
      └── Buffer unsynchronized data
               │
               │ Global recovery
               ▼
        Synchronization
               │
               ▼
        Global Backend
```

Synchronization should preserve event ordering and avoid creating
duplicate records.

Event IDs, timestamps, source IDs, and consumer offsets can be used to
support idempotent processing.

------------------------------------------------------------------------

# 30. Data Ownership by Layer

Each layer should have a clear responsibility.

  -----------------------------------------------------------------------
  Layer                               Primary Responsibility
  ----------------------------------- -----------------------------------
  CCTV                                Produce video

  AI Processing                       Convert video into observations

  Message Bus                         Transport and buffer events

  Regional Backend                    Validate, correlate, and
                                      reconstruct regional intelligence

  Global Backend                      Correlate regions and produce
                                      city-wide intelligence

  Storage                             Persist authoritative and derived
                                      data

  GIS Dashboard                       Present intelligence to users
  -----------------------------------------------------------------------

This separation prevents individual components from becoming tightly
coupled.

------------------------------------------------------------------------

# 31. Interoperability Contracts

The major contracts are:

``` text
Camera
  │
  │ Video Stream
  ▼
AI Pipeline
  │
  │ VehicleObservation
  ▼
Message Bus
  │
  │ Events
  ▼
Regional Backend
  │
  │ Regional Intelligence
  ▼
Global Backend
  │
  │ API / WebSocket
  ▼
Frontend
```

The most important contract is the `VehicleObservation`.

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
    },
    {
      "plate": "WB12AB1239",
      "confidence": 0.21
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

The contract should evolve through versioned schemas rather than
breaking existing producers and consumers.

------------------------------------------------------------------------

# 32. Separation of Raw, Processed, and Derived Data

A key interoperability principle is to distinguish different levels of
information.

``` text
RAW
 │
 ├── Video
 ├── Frames
 └── Images
       │
       ▼
PROCESSED
 │
 ├── Vehicle detections
 ├── Tracks
 ├── Plate candidates
 └── Movement estimates
       │
       ▼
STRUCTURED
 │
 └── VehicleObservation
       │
       ▼
DERIVED
 │
 ├── Vehicle identity
 ├── Trajectory
 ├── Traffic state
 ├── OD matrix
 ├── Congestion
 └── Alerts
```

Raw information should not be confused with an AI inference.

For example, an OCR result is an inference from an image, while the
original plate crop remains evidence.

------------------------------------------------------------------------

# 33. Current vs Future Deployment

The interoperability architecture is designed to remain valid across
deployment models.

### Current centralized deployment

``` text
Cameras
   │
   │ Video
   ▼
Central AI Infrastructure
   │
   │ Events
   ▼
Regional Backend
   │
   ▼
Global Backend
   │
   ▼
Dashboard
```

### Future physical edge deployment

``` text
Camera
   │
   │ Video
   ▼
Edge AI Unit
   │
   │ Events
   ▼
Regional Backend
   │
   ▼
Global Backend
   │
   ▼
Dashboard
```

The important interface is therefore:

``` text
AI Processing
      │
      │ VehicleObservation
      ▼
Regional Backend
```

Where the AI computation occurs is an infrastructure decision; the event
contract remains stable.

------------------------------------------------------------------------

# 34. Full System View

``` text
┌──────────────────────┐
│    CCTV CAMERAS      │
│                      │
│  Cam 1 ... Cam N     │
└──────────┬───────────┘
           │
           │ VIDEO
           ▼
┌─────────────────────────────────────────────┐
│              AI / EDGE LAYER                │
│                                             │
│  Frame Processing                           │
│       │                                     │
│       ▼                                     │
│  Vehicle Detection ──────► Vehicle Tracking │
│       │                         │           │
│       ▼                         │           │
│  Plate Detection                │           │
│       │                         │           │
│       ▼                         │           │
│  Plate Recognition              │           │
│       │                         │           │
│       └───────────┬─────────────┘           │
│                   ▼                         │
│            Speed / Direction                │
│                   │                         │
│                   ▼                         │
│           Structured Event                  │
└───────────────────┬─────────────────────────┘
                    │
                    │ EVENTS
                    ▼
             ┌───────────────┐
             │   REDPANDA    │
             │  MESSAGE BUS  │
             └───────┬───────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│           REGIONAL BACKEND                  │
│                                             │
│  Ingestion                                  │
│      ↓                                      │
│  Validation / Normalization                 │
│      ↓                                      │
│  Identity Resolution                        │
│      ↓                                      │
│  Camera Graph + Temporal Reasoning          │
│      ↓                                      │
│  Trajectory Reconstruction                  │
│      ↓                                      │
│  Regional Analytics                         │
└───────────────────────┬─────────────────────┘
                        │
                        │ REGIONAL DATA
                        ▼
┌─────────────────────────────────────────────┐
│             GLOBAL BACKEND                  │
│                                             │
│  Cross-Region Identity Correlation          │
│      ↓                                      │
│  Cross-Region Trajectories                  │
│      ↓                                      │
│  City-Wide Analytics                        │
│      │                                      │
│      ├── Traffic Flow                       │
│      ├── OD Matrix                          │
│      ├── Bottleneck Detection               │
│      ├── Heatmaps                           │
│      └── Historical Trends                  │
│                                             │
│  Alert Engine                               │
│      ├── Blacklist                          │
│      ├── Route Anomaly                      │
│      ├── Impossible Movement                │
│      └── Suspicious Pattern                 │
└───────────────────────┬─────────────────────┘
                        │
                        │ API / WebSocket
                        ▼
┌─────────────────────────────────────────────┐
│              GIS DASHBOARD                  │
│                                             │
│  Live Map                                   │
│  Vehicle Search                             │
│  Historical Trajectory                      │
│  Traffic Heatmap                            │
│  Vehicle Density                            │
│  Average Speed                              │
│  OD Flow                                    │
│  Congestion                                 │
│  Alerts                                     │
└─────────────────────────────────────────────┘
```

------------------------------------------------------------------------

# 35. Final Interoperability Principle

traffIQ should be treated as a chain of specialized systems rather than
one monolithic application.

Each level has a clear purpose:

``` text
Video
  ↓
Observation
  ↓
Regional Identity
  ↓
Regional Trajectory
  ↓
City-Wide Identity
  ↓
City-Wide Intelligence
  ↓
Human Understanding
```

The interoperability architecture ensures that each system can evolve
independently while remaining compatible with the rest of the platform.

**The camera sees. The AI interprets. The message bus transports. The
regional backend connects. The global backend understands. The GIS
dashboard communicates.**
