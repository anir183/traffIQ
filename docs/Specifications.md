# traffIQ — System Specifications

Single reference for traffIQ's data contracts, persistence models, API interfaces, event streams, inter-system transfers, realtime updates, evidence storage, configuration, telemetry, and replay formats.

> **Contract principle:** subsystems exchange explicit, versioned, machine-readable contracts rather than implementation-specific objects.

---

## 1. Conventions

### Identifiers

| Identifier | Type | Example | Purpose |
|---|---|---|---|
| `cameraId` | string | `K017` | Stable camera |
| `regionId` | string | `KOL-CENTRAL` | Regional backend |
| `nodeId` | string | `EDGE-K017` | Processing node |
| `eventId` | UUID | `...` | Message identity |
| `observationId` | UUID | `...` | Observation identity |
| `vehicleId` | UUID | `...` | Global vehicle identity |
| `trajectoryId` | UUID | `...` | Reconstructed journey |
| `incidentId` | UUID | `...` | Incident |
| `alertId` | UUID | `...` | Alert |
| `localTrackId` | string | `184` | CV-local track |

### Time

Canonical timestamps are ISO-8601 UTC:

```text
2026-09-13T10:04:22.120Z
```

PostgreSQL uses `TIMESTAMPTZ`.

### Coordinates

WGS 84 / EPSG:4326:

```json
{"latitude":22.5726,"longitude":88.3639}
```

GeoJSON coordinates are `[longitude, latitude]`.

### Confidence

All ML confidence values are normalized to `[0.0, 1.0]`.

### Versioning

Events contain `schemaVersion`; REST APIs use `/api/v1/...`.

Breaking contract changes require a new major version.

---

# 2. Core Domain Model

```text
Camera
  │
  ├── produces ──► VehicleObservation
  │                    │
  │                    ├── vehicle attributes
  │                    ├── plate candidates
  │                    ├── movement
  │                    └── quality/provenance
  │
  ▼
Camera Graph
  │
  ▼
Identity Resolution
  │
  ▼
Vehicle ──► Trajectory ──► Traffic Analytics
                       │
                       ├── Incidents
                       └── Alerts
```

Core objects:

```text
Camera
Vehicle
VehicleObservation
PlateCandidate
Trajectory
TrajectoryPoint
CameraEdge
TrafficSegment
TrafficSnapshot
Incident
Alert
WatchlistEntry
EdgeNode
HealthStatus
```

---

# 3. Camera

## JSON

```json
{
  "cameraId": "K017",
  "name": "Park Street Junction",
  "regionId": "KOL-CENTRAL",
  "roadId": "RD-1024",
  "location": {
    "latitude": 22.5521,
    "longitude": 88.3522
  },
  "direction": "NORTH",
  "status": "online",
  "stream": {
    "protocol": "RTSP",
    "enabled": true
  }
}
```

Status values:

```text
online
offline
degraded
maintenance
unknown
```

## SQL

```sql
CREATE TABLE cameras (
    camera_id       VARCHAR(64) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    region_id       VARCHAR(64) NOT NULL,
    road_id         VARCHAR(64),
    latitude        DOUBLE PRECISION NOT NULL,
    longitude       DOUBLE PRECISION NOT NULL,
    direction       VARCHAR(32),
    status          VARCHAR(32) NOT NULL DEFAULT 'unknown',
    stream_protocol VARCHAR(32),
    stream_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

A PostGIS deployment may additionally use:

```sql
location GEOGRAPHY(POINT, 4326)
```

with a GiST spatial index.

---

# 4. Vehicle

A `Vehicle` is a persistent/global identity inferred from observations. It is **not** the same thing as a raw observation.

## JSON

```json
{
  "vehicleId": "550e8400-e29b-41d4-a716-446655440000",
  "plate": "WB12AB1234",
  "vehicleType": "car",
  "color": "white",
  "make": null,
  "firstSeenAt": "2026-09-13T09:55:10Z",
  "lastSeenAt": "2026-09-13T10:15:42Z"
}
```

Vehicle types:

```text
car
motorcycle
scooter
bus
truck
van
auto_rickshaw
bicycle
unknown
```

## SQL

```sql
CREATE TABLE vehicles (
    vehicle_id       UUID PRIMARY KEY,
    normalized_plate VARCHAR(32),
    vehicle_type     VARCHAR(32),
    color            VARCHAR(64),
    make             VARCHAR(128),
    first_seen_at    TIMESTAMPTZ,
    last_seen_at     TIMESTAMPTZ,
    metadata         JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vehicles_plate ON vehicles(normalized_plate);
```

---

# 5. VehicleObservation — Primary Interoperability Contract

`VehicleObservation` is the main contract between CV processing and the rest of traffIQ.

The same contract is used by:

```text
Real CV ──────────┐
Future edge node ─┼──► VehicleObservation
Simulator ────────┤
Replay ───────────┘
```

## Canonical JSON

```json
{
  "schemaVersion": "1.0",
  "eventId": "8d3d6e4d-2f4e-4f3d-9a20-2f2a6f7e9f10",
  "observationId": "1db6f8f4-1f65-4df5-93de-8a77d7a4f201",
  "cameraId": "K017",
  "regionId": "KOL-CENTRAL",
  "nodeId": "EDGE-K017",
  "timestamp": "2026-09-13T10:04:22.120Z",
  "localTrackId": "184",
  "vehicle": {
    "type": "car",
    "color": "white",
    "make": null
  },
  "plate": {
    "text": "WB12AB1234",
    "confidence": 0.96,
    "candidates": [
      {"text": "WB12AB1234", "confidence": 0.96},
      {"text": "WB12AB123A", "confidence": 0.71},
      {"text": "WB12AB1284", "confidence": 0.42}
    ]
  },
  "movement": {
    "speedKmh": 42.3,
    "direction": "NORTH"
  },
  "position": {
    "latitude": 22.5726,
    "longitude": 88.3639
  },
  "quality": {
    "frameQuality": 0.91,
    "plateQuality": 0.94,
    "trackingQuality": 0.88
  },
  "source": {
    "type": "edge",
    "modelVersion": "cv-0.1.0"
  }
}
```

## Field contract

| Field | Type | Required | Notes |
|---|---|---:|---|
| `schemaVersion` | string | yes | Contract version |
| `eventId` | UUID | yes | Unique message |
| `observationId` | UUID | yes | Unique observation |
| `cameraId` | string | yes | Source camera |
| `regionId` | string | yes | Source region |
| `nodeId` | string | no | Processing node |
| `timestamp` | datetime | yes | UTC observation time |
| `localTrackId` | string | yes | Local CV identity |
| `vehicle` | object | yes | Vehicle attributes |
| `plate` | object | no | ANPR result |
| `movement` | object | no | Speed/direction |
| `position` | object | yes | Geographic position |
| `quality` | object | no | Quality metrics |
| `source` | object | yes | Provenance |

Important distinction:

```text
localTrackId  !=  vehicleId
```

`localTrackId` only has meaning inside the producing camera/node context.

---

# 6. Observation SQL

```sql
CREATE TABLE observations (
    observation_id   UUID PRIMARY KEY,
    event_id         UUID NOT NULL UNIQUE,
    camera_id        VARCHAR(64) NOT NULL,
    region_id        VARCHAR(64) NOT NULL,
    node_id          VARCHAR(64),
    timestamp        TIMESTAMPTZ NOT NULL,
    local_track_id   VARCHAR(128),

    vehicle_type     VARCHAR(32),
    vehicle_color    VARCHAR(64),
    vehicle_make     VARCHAR(128),

    plate_text       VARCHAR(32),
    plate_confidence DOUBLE PRECISION,

    speed_kmh        DOUBLE PRECISION,
    direction        VARCHAR(32),

    latitude         DOUBLE PRECISION,
    longitude        DOUBLE PRECISION,

    quality          JSONB,
    plate_candidates JSONB,
    source_metadata  JSONB,

    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_obs_camera_time
    ON observations(camera_id, timestamp);

CREATE INDEX idx_obs_plate_time
    ON observations(plate_text, timestamp);

CREATE INDEX idx_obs_region_time
    ON observations(region_id, timestamp);

CREATE INDEX idx_obs_time
    ON observations(timestamp);
```

For very large deployments, observations should eventually be time/region partitioned.

---

# 7. Event Envelope

All asynchronous events use a common envelope.

```json
{
  "schemaVersion": "1.0",
  "eventId": "8d3d6e4d-2f4e-4f3d-9a20-2f2a6f7e9f10",
  "eventType": "vehicle.observation.created",
  "timestamp": "2026-09-13T10:04:22.120Z",
  "producer": {
    "type": "edge",
    "id": "EDGE-K017"
  },
  "regionId": "KOL-CENTRAL",
  "payload": {}
}
```

The envelope carries transport/provenance metadata; `payload` carries the domain object.

---

# 8. Event Types and Topics

| Event | Topic | Producer | Main consumer |
|---|---|---|---|
| `vehicle.observation.created` | `vehicle-observations` | CV/edge | Regional |
| `vehicle.observation.corrected` | `vehicle-observations` | CV/backend | Regional |
| `vehicle.identity.created` | `vehicle-events` | Regional | Global |
| `vehicle.identity.updated` | `vehicle-events` | Regional | Global |
| `trajectory.created` | `trajectory-events` | Regional | Global |
| `trajectory.updated` | `trajectory-events` | Regional | Global |
| `trajectory.completed` | `trajectory-events` | Regional | Global |
| `traffic.snapshot.created` | `traffic-events` | Analytics | Global/UI |
| `incident.created` | `incident-events` | Detection | UI/backend |
| `incident.updated` | `incident-events` | Backend | UI |
| `alert.created` | `alert-events` | Alert engine | UI/operations |
| `alert.updated` | `alert-events` | Backend | UI |
| `camera.status.changed` | `camera-events` | Monitoring | UI |
| `node.health.updated` | `health-events` | Edge | Monitoring |

Do not create a topic per camera.

Recommended partition keys:

```text
observations  → vehicle identity / normalized plate
camera events → cameraId
health        → nodeId
trajectories  → vehicleId
```

---

# 9. Delivery and Reliability

Initial event semantics:

```text
at-least-once delivery
```

Consumers must therefore be idempotent.

Deduplicate using:

```text
eventId
observationId
```

The database should enforce uniqueness where appropriate:

```sql
UNIQUE(event_id)
```

Malformed/repeatedly failing messages go to:

```text
vehicle-observations-dlq
```

Example DLQ envelope:

```json
{
  "originalTopic": "vehicle-observations",
  "originalPartition": 3,
  "originalOffset": 18291,
  "failedAt": "2026-09-13T10:05:00Z",
  "failureCode": "SCHEMA_VALIDATION_ERROR",
  "failureMessage": "Missing cameraId",
  "originalEvent": {}
}
```

---

# 10. Trajectory

A trajectory is a reconstructed movement of a vehicle across observations/cameras.

## JSON

```json
{
  "trajectoryId": "9f8a7d6c-5b4a-3210-9abc-def012345678",
  "vehicleId": "550e8400-e29b-41d4-a716-446655440000",
  "startTime": "2026-09-13T09:55:10Z",
  "endTime": "2026-09-13T10:15:42Z",
  "startCameraId": "K011",
  "endCameraId": "K024",
  "confidence": 0.94,
  "points": [
    {
      "cameraId": "K011",
      "timestamp": "2026-09-13T09:55:10Z",
      "latitude": 22.5511,
      "longitude": 88.3501
    },
    {
      "cameraId": "K017",
      "timestamp": "2026-09-13T10:04:22Z",
      "latitude": 22.5521,
      "longitude": 88.3522
    }
  ]
}
```

## SQL

```sql
CREATE TABLE trajectories (
    trajectory_id   UUID PRIMARY KEY,
    vehicle_id      UUID NOT NULL,
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ,
    start_camera_id VARCHAR(64),
    end_camera_id   VARCHAR(64),
    confidence      DOUBLE PRECISION,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trajectory_points (
    trajectory_id  UUID NOT NULL,
    sequence_no    INTEGER NOT NULL,
    camera_id      VARCHAR(64),
    observation_id UUID,
    timestamp      TIMESTAMPTZ NOT NULL,
    latitude       DOUBLE PRECISION,
    longitude      DOUBLE PRECISION,
    speed_kmh      DOUBLE PRECISION,
    direction      VARCHAR(32),
    PRIMARY KEY (trajectory_id, sequence_no)
);

CREATE INDEX idx_trajectory_points_time
    ON trajectory_points(timestamp);
```

---

# 11. Camera Graph

Represents plausible transitions between cameras.

```json
{
  "fromCameraId": "K017",
  "toCameraId": "K024",
  "roadDistanceMeters": 1450,
  "expectedTravelTimeSeconds": {
    "min": 90,
    "max": 600
  },
  "allowedDirections": ["NORTH", "NORTHEAST"]
}
```

```sql
CREATE TABLE camera_edges (
    from_camera_id          VARCHAR(64) NOT NULL,
    to_camera_id            VARCHAR(64) NOT NULL,
    road_distance_meters    DOUBLE PRECISION,
    min_travel_time_seconds DOUBLE PRECISION,
    max_travel_time_seconds DOUBLE PRECISION,
    allowed_directions      JSONB,
    metadata                 JSONB,
    PRIMARY KEY (from_camera_id, to_camera_id)
);
```

Used for:

- cross-camera identity resolution
- temporal reasoning
- route validation
- impossible movement detection

---

# 12. Traffic Segment

```json
{
  "segmentId": "SEG-1024",
  "roadId": "RD-1024",
  "name": "Park Street",
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [88.3521, 22.5521],
      [88.3542, 22.5534]
    ]
  },
  "speedLimitKmh": 40
}
```

---

# 13. Traffic Snapshot

```json
{
  "segmentId": "SEG-1024",
  "timestamp": "2026-09-13T10:05:00Z",
  "vehicleCount": 87,
  "averageSpeedKmh": 18.4,
  "flowPerHour": 522,
  "occupancy": 0.73,
  "congestionLevel": "HIGH"
}
```

Congestion:

```text
FREE
LOW
MODERATE
HIGH
SEVERE
UNKNOWN
```

```sql
CREATE TABLE traffic_snapshots (
    segment_id        VARCHAR(64) NOT NULL,
    timestamp         TIMESTAMPTZ NOT NULL,
    vehicle_count     INTEGER,
    average_speed_kmh DOUBLE PRECISION,
    flow_per_hour     DOUBLE PRECISION,
    occupancy         DOUBLE PRECISION,
    congestion_level  VARCHAR(32),
    metadata          JSONB,
    PRIMARY KEY (segment_id, timestamp)
);
```

---

# 14. Incident

```json
{
  "incidentId": "2e2a1e9d-51a2-4a37-b6a4-5b4b9d1e8a11",
  "type": "ACCIDENT",
  "severity": "HIGH",
  "status": "OPEN",
  "timestamp": "2026-09-13T10:10:00Z",
  "cameraId": "K017",
  "location": {
    "latitude": 22.5521,
    "longitude": 88.3522
  },
  "description": "Possible collision detected",
  "confidence": 0.87
}
```

Types:

```text
ACCIDENT
CONGESTION
VEHICLE_BREAKDOWN
ROAD_OBSTRUCTION
WRONG_WAY
SUSPICIOUS_VEHICLE
CAMERA_FAILURE
NETWORK_FAILURE
OTHER
```

Severity:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Status:

```text
OPEN
ACKNOWLEDGED
RESOLVED
DISMISSED
```

```sql
CREATE TABLE incidents (
    incident_id UUID PRIMARY KEY,
    type        VARCHAR(64) NOT NULL,
    severity    VARCHAR(32) NOT NULL,
    status      VARCHAR(32) NOT NULL,
    timestamp   TIMESTAMPTZ NOT NULL,
    camera_id   VARCHAR(64),
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    description TEXT,
    confidence  DOUBLE PRECISION,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 15. Alert

```json
{
  "alertId": "8f3b7f23-3e0d-4a11-9f6c-6b5e8c5a1234",
  "type": "BLACKLISTED_VEHICLE",
  "severity": "CRITICAL",
  "timestamp": "2026-09-13T10:11:22Z",
  "vehicleId": "550e8400-e29b-41d4-a716-446655440000",
  "cameraId": "K017",
  "status": "OPEN",
  "reason": "Vehicle matched active watchlist entry",
  "confidence": 0.98
}
```

Types:

```text
BLACKLISTED_VEHICLE
ROUTE_ANOMALY
IMPOSSIBLE_MOVEMENT
SUSPICIOUS_PATTERN
SPEED_VIOLATION
CAMERA_FAILURE
NETWORK_FAILURE
SYSTEM_FAILURE
OTHER
```

```sql
CREATE TABLE alerts (
    alert_id   UUID PRIMARY KEY,
    type       VARCHAR(64) NOT NULL,
    severity   VARCHAR(32) NOT NULL,
    status     VARCHAR(32) NOT NULL,
    timestamp  TIMESTAMPTZ NOT NULL,
    vehicle_id UUID,
    camera_id  VARCHAR(64),
    incident_id UUID,
    reason     TEXT,
    confidence DOUBLE PRECISION,
    metadata   JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_time ON alerts(timestamp);
CREATE INDEX idx_alerts_status ON alerts(status);
```

---

# 16. Watchlist

```json
{
  "plate": "WB12AB1234",
  "status": "ACTIVE",
  "reason": "Example watchlist entry",
  "priority": "HIGH",
  "createdAt": "2026-09-01T10:00:00Z",
  "expiresAt": null
}
```

```sql
CREATE TABLE watchlist_entries (
    entry_id          UUID PRIMARY KEY,
    normalized_plate  VARCHAR(32) NOT NULL,
    status            VARCHAR(32) NOT NULL,
    priority          VARCHAR(32),
    reason            TEXT,
    created_at        TIMESTAMPTZ NOT NULL,
    expires_at        TIMESTAMPTZ,
    metadata          JSONB
);

CREATE INDEX idx_watchlist_plate
    ON watchlist_entries(normalized_plate);
```

Watchlist and identifying evidence require stricter authorization than aggregate traffic data.

---

# 17. REST API

Base:

```text
/api/v1
```

## Cameras

```http
GET /api/v1/cameras
GET /api/v1/cameras/{cameraId}
GET /api/v1/cameras/{cameraId}/health
```

List query parameters:

```text
regionId
status
roadId
page
size
```

Example response:

```json
{
  "items": [
    {
      "cameraId": "K017",
      "name": "Park Street Junction",
      "regionId": "KOL-CENTRAL",
      "status": "online",
      "latitude": 22.5521,
      "longitude": 88.3522
    }
  ],
  "page": 0,
  "size": 50,
  "total": 1
}
```

## Vehicles

```http
GET /api/v1/vehicles
GET /api/v1/vehicles/{vehicleId}
GET /api/v1/vehicles/by-plate/{plate}
GET /api/v1/vehicles/{vehicleId}/trajectory
```

Vehicle search parameters:

```text
plate
vehicleType
firstSeenAfter
firstSeenBefore
lastSeenAfter
lastSeenBefore
page
size
```

## Observations

```http
GET /api/v1/observations
GET /api/v1/observations/{observationId}
```

Parameters:

```text
cameraId
regionId
plate
from
to
page
size
```

## Trajectories

```http
GET /api/v1/trajectories/{trajectoryId}
GET /api/v1/vehicles/{vehicleId}/trajectory
GET /api/v1/vehicles/{vehicleId}/trajectory.geojson
```

Parameters:

```text
from
to
includeObservations
```

---

# 18. Traffic and GIS APIs

```http
GET /api/v1/traffic
GET /api/v1/traffic/history
GET /api/v1/analytics/flow
GET /api/v1/analytics/congestion
GET /api/v1/analytics/origin-destination
GET /api/v1/analytics/dashboard

GET /api/v1/gis/cameras
GET /api/v1/gis/traffic
```

Current traffic response:

```json
{
  "timestamp": "2026-09-13T10:05:00Z",
  "segments": [
    {
      "segmentId": "SEG-1024",
      "vehicleCount": 87,
      "averageSpeedKmh": 18.4,
      "congestionLevel": "HIGH"
    }
  ]
}
```

Dashboard response:

```json
{
  "timestamp": "2026-09-13T10:05:00Z",
  "trackedVehicles": 18342,
  "activeCameras": 987,
  "averageSpeedKmh": 28.7,
  "activeIncidents": 14,
  "congestedSegments": 31
}
```

GeoJSON response:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [88.3522, 22.5521]
      },
      "properties": {
        "cameraId": "K017",
        "status": "online"
      }
    }
  ]
}
```

---

# 19. Incident and Alert APIs

```http
GET   /api/v1/incidents
GET   /api/v1/incidents/{incidentId}
POST  /api/v1/incidents
PATCH /api/v1/incidents/{incidentId}

GET   /api/v1/alerts
GET   /api/v1/alerts/{alertId}
PATCH /api/v1/alerts/{alertId}
```

Create incident:

```json
{
  "type": "ROAD_OBSTRUCTION",
  "severity": "MEDIUM",
  "cameraId": "K017",
  "location": {
    "latitude": 22.5521,
    "longitude": 88.3522
  },
  "description": "Road obstruction detected"
}
```

Update:

```json
{"status":"ACKNOWLEDGED"}
```

---

# 20. Pagination

Collection endpoints:

```http
?page=0&size=50
```

Response:

```json
{
  "items": [],
  "page": 0,
  "size": 50,
  "total": 1000
}
```

The server must enforce a maximum page size.

---

# 21. API Errors

All errors use one structure:

```json
{
  "timestamp": "2026-09-13T10:04:22Z",
  "status": 404,
  "code": "VEHICLE_NOT_FOUND",
  "message": "No vehicle was found for the requested identifier.",
  "path": "/api/v1/vehicles/...",
  "requestId": "req-8f3b7f23"
}
```

Recommended codes:

```text
INVALID_REQUEST
VALIDATION_ERROR
NOT_FOUND
VEHICLE_NOT_FOUND
CAMERA_NOT_FOUND
TRAJECTORY_NOT_FOUND
UNAUTHORIZED
FORBIDDEN
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
SERVICE_UNAVAILABLE
```

HTTP status usage:

| Code | Meaning |
|---:|---|
| 200 | Successful read/update |
| 201 | Created |
| 202 | Accepted for async processing |
| 204 | Success, no body |
| 400 | Invalid request |
| 401 | Authentication required |
| 403 | Forbidden |
| 404 | Not found |
| 409 | Conflict |
| 422 | Validation failure |
| 429 | Rate limited |
| 500 | Server error |
| 503 | Service unavailable |

---

# 22. API Headers and Authentication

Recommended:

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>
X-Request-ID: <request-id>
```

For retry-safe creates:

```http
Idempotency-Key: <unique-key>
```

RBAC roles:

```text
ADMIN
OPERATOR
ANALYST
VIEWER
SERVICE
```

Permissions may include:

```text
vehicle:read
vehicle:trajectory:read
camera:read
camera:manage
traffic:read
incident:read
incident:manage
alert:read
alert:manage
watchlist:read
watchlist:manage
system:admin
```

---

# 23. WebSocket

Recommended endpoint:

```text
/ws/v1/events
```

Client:

```json
{
  "action": "subscribe",
  "channels": [
    "traffic",
    "incidents",
    "alerts",
    "camera-status"
  ]
}
```

Server:

```json
{
  "type": "traffic.updated",
  "timestamp": "2026-09-13T10:05:00Z",
  "payload": {
    "segmentId": "SEG-1024",
    "averageSpeedKmh": 18.4,
    "congestionLevel": "HIGH"
  }
}
```

Realtime event types:

```text
traffic.updated
vehicle.observation
trajectory.updated
incident.created
incident.updated
alert.created
alert.updated
camera.status
node.health
```

Do not send raw video-processing internals to the UI unless a specific monitoring feature needs them.

---

# 24. Video Transport

Raw video is separate from structured events.

```text
Camera
  │ RTSP
  ▼
GStreamer / OpenCV
  │
  ▼
AI processing
  │
  ▼
VehicleObservation
  │
  ▼
Redpanda
```

Do not normally send video frames through Redpanda.

---

# 25. Evidence/Object Storage

Use object storage for large binary data:

```text
MinIO → local development
S3    → cloud deployment
```

Suggested layout:

```text
observations/
  2026/
    09/
      13/
        K017/
          <observationId>/
            frame.jpg
            plate.jpg
            enhanced.jpg
            metadata.json
```

Database references should point to opaque object keys.

Evidence metadata:

```json
{
  "observationId": "1db6f8f4-1f65-4df5-93de-8a77d7a4f201",
  "capturedAt": "2026-09-13T10:04:22.120Z",
  "cameraId": "K017",
  "files": [
    {
      "type": "frame",
      "objectKey": "observations/.../frame.jpg",
      "contentType": "image/jpeg",
      "sha256": "..."
    },
    {
      "type": "plate",
      "objectKey": "observations/.../plate.jpg",
      "contentType": "image/jpeg",
      "sha256": "..."
    }
  ]
}
```

Hashes can verify evidence integrity.

---

# 26. Local Edge Buffer

Future physical edge nodes require durable local buffering.

Possible implementations:

```text
SQLite
RocksDB
filesystem spool
embedded queue
```

Record:

```json
{
  "eventId": "8d3d6e4d-2f4e-4f3d-9a20-2f2a6f7e9f10",
  "createdAt": "2026-09-13T10:04:22Z",
  "attempts": 3,
  "status": "PENDING",
  "payload": {}
}
```

Lifecycle:

```text
GENERATED → BUFFERED → SENT → ACKNOWLEDGED → DELETED
```

Failure behavior:

```text
Network fails
     ↓
Continue AI processing
     ↓
Store events locally
     ↓
Network returns
     ↓
Replay buffered events
```

---

# 27. Edge Node Health

```json
{
  "schemaVersion": "1.0",
  "eventId": "2c1f7e5d-7a6b-4d9c-8f21-123456789abc",
  "eventType": "node.health.updated",
  "timestamp": "2026-09-13T10:05:00Z",
  "nodeId": "EDGE-K017",
  "cameraId": "K017",
  "status": "HEALTHY",
  "metrics": {
    "cpuPercent": 48.2,
    "memoryPercent": 61.4,
    "gpuPercent": 72.8,
    "temperatureC": 57.3,
    "diskPercent": 41.7,
    "bufferDepth": 0,
    "networkLatencyMs": 24,
    "uptimeSeconds": 183421
  }
}
```

States:

```text
HEALTHY
DEGRADED
OFFLINE
MAINTENANCE
UNKNOWN
```

---

# 28. Configuration

Static configuration should be separate from runtime state.

Example:

```yaml
camera:
  id: K017
  region: KOL-CENTRAL
  direction: NORTH

processing:
  frameRate: 5
  plateConfidenceThreshold: 0.70

transport:
  topic: vehicle-observations
```

Configuration includes:

```text
camera metadata
region metadata
road/camera graph
model configuration
detection thresholds
alert rules
retention settings
transport configuration
```

Secrets must never be committed.

Use:

```text
environment variables
deployment secrets
secret manager
```

---

# 29. AI Model Metadata

```json
{
  "modelId": "plate-detector",
  "version": "1.2.0",
  "framework": "ONNX",
  "inputResolution": [640, 640],
  "trainedAt": "2026-09-01T00:00:00Z",
  "checksum": "sha256:..."
}
```

Observation provenance should record relevant model versions.

---

# 30. Cache

Valkey/Redis-compatible cache stores ephemeral, frequently accessed state.

Example keys:

```text
vehicle:{vehicleId}
camera:{cameraId}:status
traffic:{segmentId}:current
alert:{alertId}
```

Example:

```json
{
  "vehicleId": "550e8400-e29b-41d4-a716-446655440000",
  "lastCameraId": "K017",
  "lastSeenAt": "2026-09-13T10:04:22Z"
}
```

Cache data must be reconstructable and must not be the system of record.

---

# 31. Simulator Contract

The simulator must emit the exact same observation contract as real CV.

```json
{
  "schemaVersion": "1.0",
  "eventId": "sim-000001",
  "observationId": "sim-obs-000001",
  "cameraId": "SIM-K017",
  "regionId": "SIM-REGION",
  "timestamp": "2026-09-13T10:04:22Z",
  "localTrackId": "184",
  "vehicle": {"type": "car"},
  "plate": {
    "text": "WB12AB1234",
    "confidence": 0.99,
    "candidates": []
  },
  "movement": {
    "speedKmh": 42.3,
    "direction": "NORTH"
  },
  "position": {
    "latitude": 22.5726,
    "longitude": 88.3639
  },
  "source": {
    "type": "simulator",
    "modelVersion": null
  }
}
```

This ensures:

```text
Simulator ──┐
Real CV ────┼──► identical backend interface
Replay ─────┘
```

---

# 32. Replay and Batch Formats

## JSONL

Preferred for event replay:

```text
{"schemaVersion":"1.0","eventType":"vehicle.observation.created",...}
{"schemaVersion":"1.0","eventType":"vehicle.observation.created",...}
```

Benefits:

- streamable
- append-friendly
- easy to inspect
- easy to replay

## Parquet

Preferred for large analytics datasets.

Suggested columns:

```text
observation_id
event_id
camera_id
region_id
timestamp
vehicle_id
local_track_id
plate_text
plate_confidence
vehicle_type
speed_kmh
direction
latitude
longitude
```

## CSV

Human-oriented export only:

```csv
timestamp,camera_id,plate,vehicle_type,speed_kmh,direction
2026-09-13T10:04:22Z,K017,WB12AB1234,car,42.3,NORTH
```

CSV is not an internal streaming format.

---

# 33. Storage Responsibility

| Data | Primary storage |
|---|---|
| Camera metadata | PostgreSQL/PostGIS |
| Vehicle identity | PostgreSQL |
| Observations | PostgreSQL |
| Trajectories | PostgreSQL/PostGIS |
| Traffic aggregates | PostgreSQL / analytics store |
| Incidents | PostgreSQL |
| Alerts | PostgreSQL |
| Watchlists | PostgreSQL |
| Raw frames | Object storage |
| Plate crops | Object storage |
| Video evidence | Object storage |
| Event stream | Redpanda |
| Cache | Valkey |
| Edge buffer | SQLite/RocksDB/filesystem |
| Replay data | JSONL / Parquet |
| Configuration | YAML/JSON + deployment config |
| Secrets | Secret manager/environment |

---

# 34. Data Lineage

Derived objects should retain provenance where practical.

Example:

```json
{
  "sourceObservations": [
    "1db6f8f4-1f65-4df5-93de-8a77d7a4f201",
    "3ad5c2..."
  ],
  "algorithm": {
    "name": "trajectory-resolver",
    "version": "0.1.0"
  },
  "confidence": 0.94
}
```

This is important for:

```text
trajectory decisions
alerts
anomalies
traffic analytics
evidence
```

---

# 35. Regional-to-Global Contract

Regional systems publish derived events instead of exposing their databases.

```json
{
  "schemaVersion": "1.0",
  "eventId": "d9b9f1b2-4f32-4e6e-8f2a-5e9a6d7c1234",
  "eventType": "trajectory.completed",
  "timestamp": "2026-09-13T10:15:42Z",
  "regionId": "KOL-CENTRAL",
  "payload": {
    "trajectoryId": "9f8a7d6c-5b4a-3210-9abc-def012345678",
    "vehicleId": "550e8400-e29b-41d4-a716-446655440000",
    "startTime": "2026-09-13T09:55:10Z",
    "endTime": "2026-09-13T10:15:42Z"
  }
}
```

The global backend should not depend on regional database schemas.

---

# 36. Internal Service Contract

For synchronous service-to-service calls:

```http
POST /internal/v1/{resource}
Content-Type: application/json
X-Request-ID: <request-id>
X-Service-ID: <service-id>
```

Request:

```json
{
  "requestId": "req-123",
  "timestamp": "2026-09-13T10:05:00Z",
  "payload": {}
}
```

Response:

```json
{
  "requestId": "req-123",
  "status": "SUCCESS",
  "payload": {}
}
```

Internal APIs should still have explicit contracts.

---

# 37. Asynchronous Jobs

For long-running analytics:

```http
POST /api/v1/analytics/jobs
```

Request:

```json
{
  "type": "ORIGIN_DESTINATION",
  "from": "2026-09-13T00:00:00Z",
  "to": "2026-09-14T00:00:00Z",
  "regionId": "KOL-CENTRAL"
}
```

Response:

```json
{
  "jobId": "job-123",
  "status": "QUEUED"
}
```

Status:

```http
GET /api/v1/analytics/jobs/{jobId}
```

```json
{
  "jobId": "job-123",
  "status": "RUNNING",
  "progress": 0.62
}
```

States:

```text
QUEUED
RUNNING
COMPLETED
FAILED
CANCELLED
```

---

# 38. Health APIs

Every backend service:

```http
GET /health
GET /health/live
GET /health/ready
```

Example:

```json
{
  "status": "UP",
  "timestamp": "2026-09-13T10:05:00Z",
  "components": {
    "database": "UP",
    "messageBus": "UP",
    "cache": "UP",
    "objectStorage": "UP"
  }
}
```

---

# 39. Metrics

Recommended metric names:

```text
traffiq_observations_total
traffiq_observations_processed_total
traffiq_observations_failed_total
traffiq_event_processing_latency_seconds
traffiq_event_lag
traffiq_active_cameras
traffiq_camera_failures_total
traffiq_active_vehicles
traffiq_trajectories_total
traffiq_alerts_total
traffiq_incidents_total
```

Metrics implementation may use Prometheus/OpenTelemetry or another compatible system.

---

# 40. Audit Events

Security-sensitive operations should be auditable.

```json
{
  "eventId": "c8a4...",
  "eventType": "audit.action",
  "timestamp": "2026-09-13T10:05:00Z",
  "actor": {
    "type": "user",
    "id": "user-123"
  },
  "action": "WATCHLIST_ENTRY_CREATED",
  "resource": {
    "type": "watchlist",
    "id": "entry-123"
  },
  "result": "SUCCESS",
  "metadata": {}
}
```

Audit records should be append-only.

---

# 41. Validation

Minimum `VehicleObservation` validation:

```text
eventId          required UUID
observationId    required UUID
cameraId         required
timestamp        required UTC datetime
localTrackId     required
latitude         -90..90
longitude        -180..180
confidence       0..1
speedKmh         >= 0
```

Plate confidence and candidate confidence:

```text
0..1
```

Invalid messages must be rejected or isolated into a DLQ; never silently discarded.

---

# 42. Idempotency

Events:

```text
eventId → deduplication key
observationId → observation uniqueness
```

Create APIs may support:

```http
Idempotency-Key: <unique-request-id>
```

A retry must not create duplicate durable resources.

---

# 43. Retention

Retention must be configurable and policy-driven.

| Data | Example class |
|---|---|
| Live cache | minutes/hours |
| Event stream | days |
| Raw evidence | days/weeks |
| Observations | weeks/months |
| Aggregated traffic | months/years |
| Audit events | longer-term |
| Anonymized analytics | long-term |

Actual retention must follow deployment, legal, security, and privacy requirements.

---

# 44. Privacy Boundary

Separate aggregate analytics from identifying data.

```text
ANALYTICS
├── traffic density
├── average speed
├── congestion
└── flow

IDENTIFYING DATA
├── plate
├── vehicle trajectory
├── evidence images
└── watchlist data
```

Identifying data requires stricter authorization and access auditing.

---

# 45. Contract Testing

Every cross-system contract should have:

```text
schema
valid example
invalid example
producer test
consumer test
compatibility test
```

Recommended repository:

```text
contracts/
├── events/
│   ├── envelope.schema.json
│   ├── vehicle-observation.schema.json
│   ├── trajectory.schema.json
│   ├── traffic.schema.json
│   ├── incident.schema.json
│   └── alert.schema.json
├── api/
│   └── openapi.yaml
└── examples/
    ├── vehicle-observation.json
    ├── trajectory.json
    ├── incident.json
    └── alert.json
```

The implementation language must not define the cross-system contract; the schema does.

---

# 46. Compatibility Rules

Producers must:

- preserve field meaning
- avoid changing existing field types
- avoid removing required fields
- add optional fields for compatible extensions
- preserve enumeration meanings
- include schema version

Consumers must:

- ignore unknown optional fields
- validate required fields
- tolerate duplicate delivery
- log schema failures
- preserve event identity during processing

---

# 47. MVP Contract Set

The initial implementation only needs:

```text
Camera
Vehicle
VehicleObservation
Trajectory
TrafficSnapshot
```

Flow:

```text
Simulator
    │
    ▼
VehicleObservation
    │
    ▼
Redpanda
    │
    ▼
Spring Boot
    │
    ▼
PostgreSQL/PostGIS
    │
    ▼
REST
    │
    ▼
React + MapLibre
```

Minimum endpoints:

```http
GET /api/v1/cameras
GET /api/v1/vehicles
GET /api/v1/vehicles/{vehicleId}
GET /api/v1/vehicles/{vehicleId}/trajectory
GET /api/v1/observations
GET /api/v1/traffic
GET /api/v1/analytics/dashboard
```

Minimum event:

```text
vehicle.observation.created
```

---

# 48. Repository Contract Layout

The human-readable specification should remain here:

```text
docs/Specifications.md
```

Machine-readable contracts:

```text
contracts/
├── events/
├── api/
└── examples/
```

Recommended eventual structure:

```text
contracts/
├── events/
│   ├── envelope.schema.json
│   ├── vehicle-observation.schema.json
│   ├── trajectory.schema.json
│   ├── traffic.schema.json
│   ├── incident.schema.json
│   ├── alert.schema.json
│   └── node-health.schema.json
├── api/
│   └── openapi.yaml
└── examples/
    ├── vehicle-observation.json
    ├── trajectory.json
    ├── traffic.json
    ├── incident.json
    └── alert.json
```

`Specifications.md` is the human-readable reference; JSON Schema/OpenAPI become the executable contracts.

---

# 49. Complete System Contract Map

```text
                         CCTV
                           │
                           │ RTSP
                           ▼
                    AI / CV Pipeline
                           │
                           │ VehicleObservation
                           ▼
                     Event Envelope
                           │
                           ▼
                        Redpanda
                           │
                           ▼
                   Regional Backend
                    │             │
                    │             └── Regional analytics
                    ▼
             Identity / Trajectory
                    │
                    │ regional events
                    ▼
                    Global Backend
                    │      │      │
                    │      │      └── Alerts / Incidents
                    │      └───────── Traffic analytics
                    └──────────────── Vehicles / trajectories
                           │
                     REST / WebSocket
                           │
                           ▼
                     GIS Dashboard
```

Storage boundaries:

```text
PostgreSQL/PostGIS → durable structured state
Redpanda           → asynchronous event transport/history
Object Storage     → large binary evidence
Valkey             → ephemeral active state/cache
SQLite/RocksDB     → future edge buffering
JSONL              → replay
Parquet            → large analytics datasets
YAML/JSON           → configuration
Secret manager      → credentials/secrets
```

---

# 50. Final Principles

1. **`VehicleObservation` is the fundamental edge-to-backend contract.**
2. **Events provide transport; databases provide durable state.**
3. **Object storage holds large evidence files.**
4. **Cache is never the system of record.**
5. **Raw video remains outside the event bus.**
6. **Regional/global systems communicate through contracts, not database coupling.**
7. **All cross-system events are versioned.**
8. **Consumers assume at-least-once delivery and handle duplicates.**
9. **Derived data should retain provenance where practical.**
10. **JSON is the primary API/live-event interchange format.**
11. **JSONL is suitable for replay; Parquet is suitable for large analytics.**
12. **Simulator, replay and real CV use the same observation contract.**
13. **Future physical edge hardware should not require a new backend data model.**
14. **Vehicle-identifying data has stricter access requirements than aggregate analytics.**
15. **Human-readable specifications should eventually be backed by JSON Schema and OpenAPI.**

The central boundary is:

```text
RAW / IMPLEMENTATION-SPECIFIC DATA
              │
              ▼
       STRUCTURED CONTRACT
              │
              ▼
      SYSTEM INTEROPERABILITY
```

For traffIQ, the most important contracts are:

```text
Event Envelope
VehicleObservation
Trajectory
TrafficSnapshot
Incident
Alert
```
