> [!NOTE]
> This branch has been cleaned up for development. Refer to previous iterations
> at [SIH Internal Round 1](https://github.com/anir183/traffIQ/tree/sih-internal-r1)
> and [SIH Internal Round 2](https://github.com/anir183/traffIQ/tree/sih-internal-r2)

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

## Vision

**traffIQ turns camera observations into city-wide vehicle intelligence which
provides actionable insights and data with spatiotemporal significance.**
