# Frontend & User Experience

The traffIQ frontend is the operational interface for understanding
city-wide traffic, vehicles, trajectories, cameras, and incidents.

It is designed as a **GIS-first traffic intelligence dashboard**:
geographic context is the primary way information is understood, while
tables, charts, alerts, and vehicle details provide the supporting
evidence.

The interface should feel like an operations platform rather than a
generic analytics dashboard. Information should be dense enough for
monitoring, but organized so that the most important events and
decisions remain immediately visible.

------------------------------------------------------------------------

## 1. UX Philosophy

The frontend follows a few core principles.

### 1.1 Map-first

Traffic is inherently spatial. Vehicles, cameras, congestion, incidents,
routes, and traffic flows all have geographic meaning.

The map should therefore be treated as a primary application surface
rather than a decorative visualization.

``` text
                CITY TRAFFIC STATE
                        │
                        ▼
                ┌──────────────┐
                │   GIS MAP    │
                └──────┬───────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Vehicles     Cameras      Incidents
          │            │            │
          └────────────┼────────────┘
                       ▼
                 Detailed Views
```

### 1.2 Information hierarchy

Not every piece of information deserves equal visual weight.

The UI should prioritize:

1.  Active incidents and critical alerts
2.  Current traffic state
3.  Vehicle/trajectory information being investigated
4.  Camera and system health
5.  Historical analytics
6.  Supporting metadata

Important information should be visible without requiring the operator
to search through multiple screens.

### 1.3 Progressive disclosure

The interface should expose high-level information first and details
only when needed.

For example:

``` text
Map marker
   │
   ▼
Short summary
   │
   ▼
Vehicle / incident panel
   │
   ▼
Detailed history
   │
   ▼
Evidence / observations
```

This keeps the main dashboard readable while still allowing deep
investigation.

### 1.4 Consistency

Common entities should behave consistently throughout the application.

A vehicle selected on the map, for example, should lead to the same
vehicle identity and trajectory information available from the Vehicles
section.

The same principle applies to:

-   cameras
-   incidents
-   alerts
-   trajectories
-   traffic segments

### 1.5 Operational clarity

The interface is intended for monitoring and investigation.

It should avoid unnecessary decoration, excessive animation, and
dashboard elements that do not support an operational decision.

Visual emphasis should communicate meaning:

-   severity
-   activity
-   status
-   confidence
-   change over time
-   geographic importance

------------------------------------------------------------------------

# 2. Application Structure

The frontend is organized around a persistent navigation shell.

``` text
┌─────────────────────────────────────────────────────────────┐
│ traffIQ                         Search / Global Controls    │
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│ Overview      │                                             │
│ Live Feed     │              Application Content            │
│ Trajectory    │                                             │
│ Recognition   │                                             │
│ Incidents     │                                             │
│ Traffic       │                                             │
│ Analytics     │                                             │
│               │                                             │
│ Settings      │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

The sidebar provides stable navigation while the main content area
changes according to the selected workflow.

The current visual direction uses:

-   light interface
-   restrained borders
-   compact cards
-   clear typography
-   blue as the primary interactive/accent color
-   status colors only where semantic meaning is required
-   large GIS surfaces
-   dense but readable data tables

------------------------------------------------------------------------

# 3. Core Screens

## 3.1 Overview / Operations Dashboard

The overview screen provides a city-wide operational summary.

Typical components:

``` text
┌─────────────────────────────────────────────────────────────┐
│ KPI cards                                                   │
├───────────────────────────────────────┬─────────────────────┤
│                                       │                     │
│              GIS MAP                  │ Active Events /     │
│                                       │ System Information  │
│                                       │                     │
├───────────────────────────────────────┴─────────────────────┤
│ Additional traffic / system summaries                       │
└─────────────────────────────────────────────────────────────┘
```

Important information may include:

-   active vehicles
-   monitored cameras
-   current traffic condition
-   average speed
-   active incidents
-   recent alerts
-   congestion hotspots
-   traffic trends

The dashboard should answer:

> **What is happening in the city right now?**

without requiring the operator to open another page.

------------------------------------------------------------------------

# 4. Live Feed

The Live Feed provides a camera-oriented view of the system.

The interface can combine:

-   camera tiles
-   camera status
-   recent observations
-   plate recognition events
-   vehicle type
-   confidence
-   timestamp
-   camera location

Example conceptual layout:

``` text
┌───────────────────────────────┬─────────────────────────────┐
│ Camera 01                     │ Recent Observations         │
│                               │                             │
│        VIDEO                  │ Plate       Time   Status   │
│                               │ WB12...     12:04  ✓        │
│                               │ WB24...     12:04  ✓        │
├───────────────────────────────┤ WB06...     12:05  ✓        │
│ Camera 02                     │                             │
│        VIDEO                  │                             │
└───────────────────────────────┴─────────────────────────────┘
```

The frontend should distinguish between:

-   camera online/offline
-   processing active/inactive
-   degraded recognition
-   unavailable video
-   recent observation activity

A camera failure should be obvious without making the entire screen
appear broken.

------------------------------------------------------------------------

# 5. Trajectory Recognition

Trajectory Recognition is an investigation-oriented workflow.

The user can enter or select a vehicle identity and inspect its movement
through the camera network.

``` text
Vehicle / Plate
       │
       ▼
Observation Timeline
       │
       ▼
Camera Sequence
       │
       ▼
GIS Trajectory
```

The screen should combine:

-   vehicle metadata
-   recognition history
-   chronological observations
-   camera sequence
-   route on the map
-   timestamps
-   estimated speed
-   direction
-   confidence

The map and timeline should remain synchronized.

Selecting an observation in the table should highlight the corresponding
camera/location on the map.

Selecting a point on the trajectory should reveal the associated
observation.

------------------------------------------------------------------------

# 6. Incident Management

Incident Management provides a spatial view of operational events.

Examples:

-   accidents
-   congestion
-   suspicious routes
-   blacklisted vehicles
-   camera failures
-   abnormal traffic conditions

The map should provide immediate geographic context while the incident
list provides prioritization.

``` text
                  INCIDENT MANAGEMENT

┌──────────────────────────────────────┬───────────────────────┐
│                                      │ Incident List         │
│                                      │                       │
│              GIS MAP                 │ Critical              │
│                                      │ High                  │
│       incident markers               │ Medium                │
│                                      │ Low                   │
│                                      │                       │
└──────────────────────────────────────┴───────────────────────┘
```

Incidents should support states such as:

-   detected
-   acknowledged
-   investigating
-   resolved
-   dismissed

Severity should be visually distinguishable without relying on color
alone.

------------------------------------------------------------------------

# 7. Traffic Analysis

Traffic Analysis provides aggregated traffic intelligence rather than
individual vehicle investigation.

Typical metrics include:

-   vehicle volume
-   average speed
-   traffic density
-   flow rate
-   congestion level
-   vehicle type distribution
-   busiest roads/cameras
-   traffic trends

Charts should emphasize trends and comparisons rather than decoration.

A useful traffic analysis layout is:

``` text
KPI Summary
    │
    ▼
Traffic Volume + Speed Trend
    │
    ├──────────────┬───────────────┐
    ▼              ▼               ▼
Road Ranking   Vehicle Types   Live Insights
```

The page should answer questions such as:

-   Where is traffic increasing?
-   Which roads are busiest?
-   Where is average speed falling?
-   What are the dominant vehicle types?
-   How does current traffic compare with normal conditions?

------------------------------------------------------------------------

# 8. GIS Design

GIS is one of the core components of traffIQ.

The map should not simply display points. It should represent the
relationships between:

-   cameras
-   vehicles
-   roads
-   trajectories
-   traffic segments
-   congestion
-   incidents
-   zones
-   origin/destination flows

## 8.1 Map layers

The frontend should support independently controlled layers.

``` text
Map
├── Base Map
├── Roads
├── Cameras
├── Vehicles
├── Trajectories
├── Traffic Density
├── Congestion
├── Incidents
└── Traffic Flow
```

Users should be able to enable or disable layers depending on the task.

## 8.2 Camera layer

Camera markers should communicate:

-   location
-   camera ID
-   operational status
-   recent activity

Selecting a camera should expose relevant information without
immediately navigating away from the map.

## 8.3 Vehicle layer

Vehicles can be represented as:

-   current positions
-   recent observation points
-   movement directions
-   selected vehicle tracks

The map should avoid rendering thousands of individual markers
simultaneously when aggregation or clustering is more appropriate.

## 8.4 Trajectory layer

A trajectory is represented as an ordered geographic path.

``` text
Camera A ●────────● Camera B
                    \
                     \
                      ● Camera C
```

Trajectory visualization should communicate:

-   direction
-   sequence
-   timing
-   selected observation
-   route continuity

## 8.5 Congestion layer

Congestion is better represented spatially using road segments rather
than isolated points.

``` text
Road Network

───────────────
──────████████─    High congestion
────────███────    Moderate congestion
────────────────   Normal
```

The actual representation may use segment styling, heatmaps, or other
GIS techniques depending on zoom level and data density.

## 8.6 Traffic flow / OD visualization

Origin-destination analysis can be represented using directional flows
between zones.

``` text
       Zone A
          │
          │  2,450
          ▼
       Zone B ─────────► Zone C
              1,180
```

Flow visualization should support filtering by:

-   time period
-   vehicle type
-   origin
-   destination
-   direction
-   traffic volume

------------------------------------------------------------------------

# 9. GIS Interaction Principles

The map should behave as an interactive analytical surface.

Important interactions include:

-   pan
-   zoom
-   feature selection
-   hover information
-   layer toggling
-   filtering
-   clustering
-   fit-to-trajectory
-   fit-to-incident
-   time filtering
-   map-to-table synchronization

A map interaction should provide context rather than force navigation
whenever possible.

For example:

``` text
Click Camera
      │
      ▼
Camera Detail Popover
      │
      ├── Status
      ├── Recent Events
      ├── Location
      └── Open Camera View
```

------------------------------------------------------------------------

# 10. Map Technology

The preferred mapping stack is:

-   **MapLibre GL JS** for interactive maps
-   vector tiles where appropriate
-   GeoJSON for smaller dynamic datasets
-   PostGIS-backed spatial APIs
-   WebSocket updates for live information

The frontend should avoid sending unnecessarily large geographic
datasets to the browser.

Instead:

``` text
PostGIS
   │
   ▼
Spatial API
   │
   ├── viewport filtering
   ├── aggregation
   ├── clustering
   └── simplification
   │
   ▼
MapLibre
```

Spatial processing should happen server-side when datasets become large
enough that browser-side processing would become expensive.

------------------------------------------------------------------------

# 11. Real-Time UX

traffIQ is expected to receive continuously changing information.

Real-time updates may include:

-   vehicle observations
-   camera status
-   incidents
-   alerts
-   congestion state
-   traffic statistics

The frontend should update incrementally rather than constantly
rebuilding entire views.

``` text
Redpanda
   │
   ▼
Backend Processing
   │
   ▼
WebSocket
   │
   ▼
Frontend State
   │
   ├── Map
   ├── Alerts
   ├── Tables
   └── KPIs
```

Real-time updates should not cause distracting layout movement.

Use stable UI regions and update values in place wherever possible.

------------------------------------------------------------------------

# 12. Search and Investigation

The global search should provide a fast way to locate important
entities.

Potential search targets:

-   vehicle plate
-   vehicle ID
-   camera ID
-   incident ID
-   road/segment
-   geographic location

Search results should indicate the entity type and relevant context.

Example:

``` text
Search: WB12AB1234

Vehicle
├── Plate: WB12AB1234
├── Last seen: Camera K017
├── Time: 10:04
└── Open trajectory →
```

Search is particularly important for investigative workflows because
users should not have to manually navigate through the map to find a
known vehicle or camera.

------------------------------------------------------------------------

# 13. Data Visualization

Visualization should prioritize operational usefulness.

## Appropriate visualizations

-   line charts for trends
-   bar charts for comparisons
-   KPI cards for current metrics
-   maps for spatial information
-   tables for precise records
-   timelines for vehicle movement
-   flow diagrams for OD analysis

## Avoid

-   decorative charts
-   unnecessary 3D effects
-   excessive gradients
-   too many competing colors
-   charts without units or context
-   visualizations that hide the underlying data

Every chart should answer a question.

------------------------------------------------------------------------

# 14. Tables

Tables are important for exact operational data.

Typical columns include:

-   timestamp
-   camera
-   plate
-   vehicle type
-   speed
-   direction
-   confidence
-   status

Tables should support:

-   sorting
-   filtering
-   pagination or virtualization
-   row selection
-   time filtering
-   contextual actions

For large datasets, the frontend should use server-side
filtering/pagination rather than loading the entire dataset into the
browser.

------------------------------------------------------------------------

# 15. Alerts and Status

Alerts should be actionable rather than merely informational.

An alert should communicate:

1.  What happened?
2.  Where?
3.  When?
4.  How severe is it?
5.  What evidence supports it?
6.  What can the operator do next?

Example:

``` text
BLACKLIST MATCH
Vehicle: WB12AB1234
Camera: K017
Time: 10:04:22
Confidence: 96%

[View Vehicle] [View Camera] [View Evidence]
```

Status indicators should have redundant cues where possible.

For example, do not communicate a camera failure using only a red color;
combine color with text/icon/state.

------------------------------------------------------------------------

# 16. Confidence and AI Transparency

AI-generated information should not appear more certain than it actually
is.

Important AI-derived values may include:

-   plate confidence
-   vehicle detection confidence
-   identity resolution score
-   trajectory confidence
-   speed estimate
-   anomaly score

The frontend should expose confidence where it is relevant to an
operator's decision.

For example:

``` text
Plate: WB12AB1234
Confidence: 96%

Identity Match
Confidence: 91%

Speed
42 km/h (estimated)
```

This is particularly important for ANPR and cross-camera identity
resolution, where false matches can have significant operational
consequences.

------------------------------------------------------------------------

# 17. Responsive and Density Strategy

The primary target is a desktop operations environment.

The interface should therefore prioritize:

-   large map areas
-   persistent navigation
-   dense information presentation
-   keyboard-friendly workflows
-   multi-panel layouts

Mobile support can focus on:

-   alerts
-   incident summaries
-   vehicle lookup
-   basic map viewing
-   system status

The desktop experience should not be compromised to make every screen
identical on mobile.

------------------------------------------------------------------------

# 18. Accessibility

The frontend should follow standard accessibility practices.

Important requirements include:

-   sufficient text contrast
-   keyboard navigation
-   visible focus states
-   semantic controls
-   accessible tables
-   non-color-only status indicators
-   readable typography
-   meaningful labels and tooltips

Maps require additional consideration because some geographic
information is inherently visual. Important selected features and alerts
should therefore also be available through textual panels or tables.

------------------------------------------------------------------------

# 19. Performance Principles

The frontend may eventually display thousands of cameras and large
volumes of vehicle observations.

Performance should therefore be designed into the architecture.

### Prefer

-   viewport-based GIS queries
-   clustering
-   vector tiles
-   server-side aggregation
-   virtualized tables
-   incremental WebSocket updates
-   memoized derived state
-   lazy-loaded pages
-   cached API responses

### Avoid

-   rendering every vehicle as a DOM element
-   sending entire city datasets to the browser
-   recalculating all map features on every event
-   unnecessary polling
-   loading high-resolution evidence images until requested

A useful principle is:

> **Render only what the operator can currently see or act upon.**

------------------------------------------------------------------------

# 20. Frontend State Model

Frontend state should distinguish between persistent application data
and transient UI state.

``` text
Server State
├── Vehicles
├── Cameras
├── Incidents
├── Trajectories
├── Traffic Analytics
└── Alerts

Client State
├── Selected Vehicle
├── Selected Camera
├── Selected Incident
├── Map View
├── Active Layers
├── Filters
└── Time Range
```

Real-time events should update server-derived state without
unnecessarily resetting local UI state.

For example, receiving a new vehicle observation should not reset the
user's current map zoom or active filters.

------------------------------------------------------------------------

# 21. Frontend Architecture

The frontend is based on:

-   React
-   TypeScript
-   MapLibre GL JS
-   REST APIs
-   WebSocket
-   component-based UI architecture

Conceptual structure:

``` text
React Application
│
├── Application Shell
│   ├── Sidebar
│   ├── Header
│   └── Global Search
│
├── Pages
│   ├── Dashboard
│   ├── Live Feed
│   ├── Trajectory Recognition
│   ├── Incident Management
│   └── Traffic Analysis
│
├── GIS
│   ├── Map
│   ├── Layers
│   ├── Markers
│   ├── Trajectories
│   └── Controls
│
├── Data Views
│   ├── Tables
│   ├── Charts
│   ├── KPI Cards
│   └── Timelines
│
└── Realtime
    └── WebSocket State
```

------------------------------------------------------------------------

# 22. API Boundary

The frontend should communicate with the backend through stable domain
APIs.

Examples:

``` http
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

The frontend should not depend directly on database schemas.

The backend remains responsible for:

-   spatial queries
-   aggregation
-   identity resolution
-   authorization
-   validation
-   business rules

------------------------------------------------------------------------

# 23. Evidence and Media

Large evidence objects should not be loaded automatically.

Examples include:

-   plate crops
-   enhanced plate images
-   vehicle images
-   incident evidence
-   recorded clips

The preferred flow is:

``` text
Database
   │
   └── Evidence reference
            │
            ▼
      Object Storage
            │
            ▼
     Requested by UI
            │
            ▼
       Evidence View
```

This keeps normal dashboard interactions lightweight.

------------------------------------------------------------------------

# 24. Security and Privacy UX

The frontend should reflect the sensitivity of vehicle and ANPR
information.

Important principles include:

-   authenticated access
-   role-based permissions
-   restricted evidence access
-   auditability of sensitive actions
-   clear session state
-   controlled export/download functionality
-   appropriate retention messaging

Sensitive vehicle information should not be unnecessarily exposed in
global views.

For example, aggregated traffic statistics can be shown broadly while
detailed plate-level information may require a more privileged workflow.

------------------------------------------------------------------------

# 25. Design Language

The current visual direction shown in the prototype emphasizes a clean
operational dashboard.

Key characteristics:

-   white/light surfaces
-   subtle borders
-   restrained shadows
-   compact cards
-   clear typography
-   blue primary actions
-   small semantic status indicators
-   generous map area
-   minimal visual noise

The design should remain visually calm even when the underlying system
is handling a large amount of data.

The goal is:

> **High information density without high visual complexity.**

------------------------------------------------------------------------

# 26. Core User Workflows

### Monitor the city

``` text
Dashboard
   ↓
Traffic state
   ↓
Map
   ↓
Incident / congestion
   ↓
Detailed investigation
```

### Investigate a vehicle

``` text
Search plate
   ↓
Vehicle
   ↓
Observation history
   ↓
Trajectory
   ↓
GIS route
   ↓
Evidence
```

### Investigate an incident

``` text
Incident
   ↓
Map location
   ↓
Related cameras
   ↓
Related vehicles
   ↓
Evidence / timeline
   ↓
Resolution
```

### Analyze traffic

``` text
Traffic Analysis
   ↓
Select time range
   ↓
Traffic metrics
   ↓
Map / road segments
   ↓
Trend analysis
   ↓
OD / flow analysis
```

------------------------------------------------------------------------

# 27. Frontend Design Principles Summary

The traffIQ frontend should follow these principles:

1.  **GIS-first** --- geographic context is central to traffic
    intelligence.
2.  **Operational-first** --- optimize for monitoring and investigation.
3.  **Progressive disclosure** --- expose details when they become
    relevant.
4.  **Information hierarchy** --- critical information receives the
    strongest visual emphasis.
5.  **Consistent entities** --- vehicles, cameras, incidents, and
    trajectories behave consistently across the application.
6.  **Real-time without disruption** --- live data should update the
    interface without causing unnecessary movement.
7.  **AI transparency** --- confidence and estimated values should be
    visible where they matter.
8.  **Performance by design** --- aggregate, cluster, virtualize, and
    query only what is needed.
9.  **Accessible by default** --- important information should not
    depend on color or mouse interaction alone.
10. **Security-aware** --- sensitive ANPR and vehicle information should
    follow appropriate access controls.
11. **Evidence on demand** --- expensive media should be loaded only
    when requested.
12. **Calm visual language** --- high information density should not
    become visual clutter.

------------------------------------------------------------------------

# 28. Final Frontend Principle

The frontend is the human-facing layer of traffIQ.

Its purpose is not simply to display data collected by the backend. It
should transform the system's observations, trajectories, analytics, and
alerts into an interface through which an operator can understand **what
is happening, where it is happening, why it matters, and what should be
investigated next**.

``` text
Cameras
   │
   ▼
AI Observations
   │
   ▼
Backend Intelligence
   │
   ├── Vehicles
   ├── Trajectories
   ├── Traffic
   ├── Incidents
   └── Alerts
          │
          ▼
     GIS + Analytics
          │
          ▼
     ┌─────────────┐
     │   traffIQ   │
     │  Frontend   │
     └──────┬──────┘
            │
            ▼
     Human Decision
```

**traffIQ's frontend turns city-wide traffic intelligence into an
understandable operational view.**
