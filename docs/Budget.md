# Budget & Cost Model

This document estimates the expenditure required to deploy **traffIQ
across one metropolitan city in India**.

The model separates:

-   **CAPEX** --- one-time acquisition and deployment costs.
-   **OPEX** --- recurring yearly operating costs.
-   **Central AI** --- CCTV video is processed in centralized GPU
    infrastructure.
-   **Per-camera edge AI** --- each camera has a dedicated AI node and
    sends structured events upstream.

The figures are intended as a **planning-level architecture budget**,
not a procurement quotation. Cloud prices, exchange rates, hardware
availability, taxes, data-transfer volume, camera count and AI
throughput can materially change the final cost.

The baseline city model used here is **1,000 traffic-relevant CCTV/ANPR
cameras**. This is a representative metropolitan deployment size rather
than a claim that a particular city currently has exactly 1,000 cameras.

------------------------------------------------------------------------

# 1. Executive Summary

For a 1,000-camera metropolitan deployment, the two main architectures
have very different cost structures.

  -------------------------------------------------------------------------
  Architecture         Year-1 order of     Recurring annual Main cost
                             magnitude   order of magnitude driver
  --------------- -------------------- -------------------- ---------------
  **Per-camera       **\~₹29.1 crore**            **\~₹2.83 1,000 edge
  Edge AI**                            crore/year + usage** nodes

  **Central AI               **\~₹60.7            **\~₹60.7 Central GPU
  --- 10 GPUs**            lakh/year**  lakh/year + usage** inference

  **Central AI               **\~₹1.33            **\~₹1.33 Central GPU
  --- 25 GPUs**           crore/year** crore/year + usage** inference

  **Central AI               **\~₹2.55            **\~₹2.55 Central GPU
  --- 50 GPUs**           crore/year** crore/year + usage** inference

  **Central AI               **\~₹4.97            **\~₹4.97 Central GPU
  --- 100 GPUs**          crore/year** crore/year + usage** inference
  -------------------------------------------------------------------------

The central-AI figures above include the common backend infrastructure
plus the stated number of `g4dn.xlarge` GPU instances.

The edge figure includes the initial hardware purchase. It is therefore
not directly comparable to a central-AI annual OPEX figure unless the
edge hardware is amortized over its service life.

------------------------------------------------------------------------

# 2. Costing Assumptions

  -----------------------------------------------------------------------
  Parameter                           Baseline
  ----------------------------------- -----------------------------------
  Geographic scope                    One Indian metropolitan city

  Camera count                        1,000

  Camera processing model             One AI processing pipeline per
                                      camera

  Edge architecture                   One dedicated edge node per camera

  Central architecture                Central GPU inference

  Backend region                      AWS Mumbai (`ap-south-1`)

  Backend compute                     2 × `m7i.2xlarge`

  Database                            Amazon RDS for PostgreSQL,
                                      `db.m7g.large`, Multi-AZ

  Cache                               Amazon ElastiCache for Valkey

  Streaming                           Redpanda Cloud Serverless

  Object storage                      Amazon S3 Standard

  Edge reference computer             Seeed reComputer Industrial J4012,
                                      Jetson Orin NX 16GB

  Edge backup connectivity            Quectel EC25-series LTE module

  Edge GNSS                           u-blox MAX-M10M family

  Edge power                          Local DC/UPS backup

  Operating assumption                24 × 7

  Cloud FX planning rate              \~₹95.55 / USD

  Taxes                               AWS prices generally exclude
                                      applicable taxes; hardware prices
                                      may include GST depending on
                                      supplier
  -----------------------------------------------------------------------

AWS's published prices are generally in USD and exclude applicable
taxes. The INR conversions in this document therefore use the stated
planning FX rate rather than pretending that AWS publishes fixed INR
prices. AWS pricing is usage- and region-dependent.
citeturn1search1turn1search0

The \~₹95.55/USD planning rate is consistent with September 2026 USD/INR
observations around ₹95--96/USD. citeturn4news19turn4search17

------------------------------------------------------------------------

# 3. CAPEX vs OPEX

## CAPEX

CAPEX represents hardware or infrastructure purchased for deployment.

For traffIQ this primarily includes:

  -----------------------------------------------------------------------
  CAPEX category                        Edge AI                Central AI
  ------------------- ------------------------- -------------------------
  Per-camera AI                         **Yes**                        No
  computers                                     

  LTE/GNSS hardware                     **Yes**                        No

  Local UPS/power                       **Yes**                        No
  hardware                                      

  Local storage                         **Yes**                        No

  Central cloud            No hardware purchase              Usually OPEX
  servers                                       

  Database                 No hardware purchase              Usually OPEX
  infrastructure                                

  GPU infrastructure                         No   Usually OPEX when using
                                                                      AWS

  Camera hardware       Existing infrastructure   Existing infrastructure
  itself                             assumption                assumption
  -----------------------------------------------------------------------

The existing CCTV cameras are **not included** in this budget because
traffIQ is treated as an intelligence/processing platform operating on
an existing metropolitan camera network.

## OPEX

OPEX includes resources consumed continuously:

-   electricity
-   cellular backup connectivity
-   hardware maintenance
-   cloud compute
-   managed database
-   cache
-   event streaming
-   object storage
-   data transfer
-   software/service operations

------------------------------------------------------------------------

# 4. Version 1 --- Per-Camera Edge AI

The edge architecture places a dedicated AI computer at each camera.

``` text
CCTV
 │
 ▼
Edge AI Node
 │
 ├── AI inference
 ├── local storage
 ├── event buffer
 ├── GNSS / RTC
 ├── health telemetry
 └── LTE backup
 │
 ▼
Regional Backend
```

The key economic trade-off is:

> **Higher CAPEX in exchange for lower central GPU and video-network
> requirements.**

------------------------------------------------------------------------

# 5. Edge Node CAPEX

The reference node is based on a **Seeed reComputer Industrial J4012
with NVIDIA Jetson Orin NX 16GB**.

The historical planning configuration used for the project is:

  ------------------------------------------------------------------------
  Component             Exact model / basis             Planning unit cost
  --------------------- --------------------- ----------------------------
  AI computer           Seeed reComputer                         ₹2,41,959
                        Industrial J4012 ---  
                        Jetson Orin NX 16GB   

  LTE fallback          Quectel                                    ₹10,565
                        EC25AUFA-MINIPCIE     

  GNSS                  u-blox MAX-M10M-00B                         ₹2,563

  DC/UPS backup         12 V DC UPS, \~2--4 h                     \~₹5,000
                        design target         

  GNSS/LTE antennas +   Industrial-grade set                      \~₹3,000
  cabling                                     

  **Planning total**                                  **\~₹2,63,087/node**
  ------------------------------------------------------------------------

The **₹2.63 lakh/node** figure is intentionally conservative and follows
the project's previous evaluation.

Current Indian distributor listings can be lower. For example, DigiKey
India currently lists a Seeed J4012 industrial unit around ₹1.85 lakh
and a J4012B Jetson Orin NX 16GB variant around ₹1.62 lakh; an Indian
reseller lists a J4012 around ₹1.11 lakh. These are different
SKUs/configurations and therefore should not be substituted into the
planning total without checking the exact required industrial
configuration. citeturn3search0turn3search4turn3search7

### Pricing references

  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  Item                                Pricing / product reference
  ----------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------
  Seeed reComputer Industrial J4012   [DigiKey India --- Seeed Industrial J4012](https://www.digikey.in/en/products/filter/industrial-pcs/1062)

  Seeed J4012B Jetson Orin NX 16GB    [DigiKey India --- 114993489](https://www.digikey.in/en/products/detail/seeed-technology-co-ltd/114993489/)

  Seeed J4012 India reseller          [Evelta India --- reComputer
  reference                           J4012](https://evelta.com/recomputer-j4012-edge-ai-computer-with-nvidia-jetson-orin-nx-16gb-no-super-mode-wi-fi-bt-with-power-adapter/)

  Quectel EC25 family                 [Quectel EC25 documentation](https://www.quectel.com/product/ec25-series)

  Quectel EC25AUFA                    [Mouser India --- EC25AUFA-MINIPCIE](https://www.mouser.in/c/?q=EC25AUFA-MINIPCIE)

  u-blox MAX-M10M-00B                 [DigiKey India --- MAX-M10M-00B](https://www.digikey.in/en/products/detail/u-blox/MAX-M10M-00B/15712905)
  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

DigiKey currently lists the MAX-M10M-00B at approximately ₹751/unit in
low quantity, demonstrating why the older ₹2,563 planning figure should
be treated as a conservative procurement allowance rather than a current
guaranteed price. citeturn1search4

The UPS, antenna, cabling and installation allowances are **engineering
estimates**, not fixed manufacturer prices. They should be replaced by
procurement quotations before deployment.

------------------------------------------------------------------------

# 6. Edge Hardware CAPEX for 1,000 Cameras

Using the project's conservative planning value:

**₹2,63,087 × 1,000 ≈ ₹26.31 crore**

  CAPEX                  Basis                                    Cost
  ---------------------- ------------------------- -------------------
  Edge AI nodes          1,000 × \~₹2.63 lakh        **\~₹26.3 crore**
  Camera hardware        Existing infrastructure                    ₹0
  Central GPU purchase   AWS compute is OPEX                        ₹0
  **Total edge CAPEX**                               **\~₹26.3 crore**

This is the largest single cost in the edge architecture.

------------------------------------------------------------------------

# 7. Edge Node Annual OPEX

The project's planning assumptions are:

  ------------------------------------------------------------------------------------
  OPEX item            Basis                      Per node / year   1,000 nodes / year
  -------------------- ---------------- ------------------------- --------------------
  Electricity          \~40 W average ×                  \~₹3,500       **\~₹35 lakh**
                       ₹10/kWh                                    

  LTE backup           \~₹300/month                      \~₹3,600       **\~₹36 lakh**

  Hardware             \~₹20,000/year                   \~₹20,000     **\~₹2.0 crore**
  maintenance/spares                                              

  Storage/component    Included in                       Included             Included
  replacement          maintenance                                
                       allowance                                  

  **Total edge OPEX**                     **\~₹27,100/node/year**            **\~₹2.71
                                                                          crore/year**
  ------------------------------------------------------------------------------------

### Important interpretation

The 4G/LTE line is a **backup connectivity allowance**, not the primary
data path.

The normal path is expected to be Ethernet/fiber/private network
connectivity. Therefore the LTE budget represents:

``` text
Primary network
      │
      ├── Healthy → Normal operation
      │
      └── Failure → LTE backup
```

Actual cellular pricing depends on the operator, data allowance and
enterprise IoT plan.

------------------------------------------------------------------------

# 8. Common Backend Infrastructure

Both architectures require a backend.

``` text
             Regional / Global Backend
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
      EC2            RDS           Cache
        │              │              │
        └──────────────┼──────────────┘
                       │
                Event Streaming
                       │
                       ▼
                      S3
```

The reference AWS Mumbai deployment is:

  -------------------------------------------------------------------------------
  Function             Exact service    Configuration       Monthly planning cost
  -------------------- ---------------- ------------------- ---------------------
  Spring Boot backend  Amazon EC2       2 × `m7i.2xlarge`,              \~₹59,200
                                        Linux               

  PostgreSQL/PostGIS   Amazon RDS for   `db.m7g.large`,                 \~₹33,400
                       PostgreSQL       Multi-AZ            

  Cache                Amazon           `cache.t4g.small`                \~₹1,800
                       ElastiCache for                      
                       Valkey                               

  Event streaming      Redpanda Cloud   1 cluster, base +   \~₹7,000 base + usage
                       Serverless       usage               

  Object storage       Amazon S3        \~100 GB                           \~₹240
                       Standard                             

  **Fixed backend                                                       **\~₹1.02
  baseline**                                                         lakh/month**
  -------------------------------------------------------------------------------

AWS identifies `m7i.2xlarge` as an 8-vCPU / 32-GiB instance.
citeturn2search1

Amazon RDS for PostgreSQL supports Multi-AZ deployments and bills
database instance hours, storage, backups and data transfer separately.
citeturn1search0

ElastiCache supports Valkey through both node-based and serverless
pricing models; actual charges depend on node type or serverless
data/request consumption. citeturn2search0

Redpanda Serverless is usage-based, with charges based on uptime,
ingress, egress, partitions and storage; the precise amount therefore
cannot honestly be represented as a permanently fixed ₹7,000/month.
citeturn1search3turn1search6

S3 charges depend on storage, requests, retrieval, transfer and other
selected features. The \~₹240 figure therefore represents only the small
100-GB storage component, not arbitrary transfer or request volume.
citeturn1search2

------------------------------------------------------------------------

# 9. Backend Pricing References

  --------------------------------------------------------------------------------------------------------------------------------------------------
  Service                 Exact service/model     Official pricing documentation
  ----------------------- ----------------------- --------------------------------------------------------------------------------------------------
  EC2                     `m7i.2xlarge`           [AWS EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/)

  EC2 instance            `m7i.2xlarge`           [AWS M7i specifications](https://aws.amazon.com/ec2/instance-types/general-purpose/)
  specification                                   

  RDS                     PostgreSQL,             [AWS RDS PostgreSQL Pricing](https://aws.amazon.com/rds/postgresql/pricing/)
                          `db.m7g.large`,         
                          Multi-AZ                

  ElastiCache             Valkey,                 [AWS ElastiCache Pricing](https://aws.amazon.com/elasticache/pricing/)
                          `cache.t4g.small`       

  Redpanda                Cloud Serverless        [Redpanda
                                                  Serverless](https://docs.redpanda.com/cloud-data-platform/get-started/cluster-types/serverless/)

  S3                      Standard                [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)
  --------------------------------------------------------------------------------------------------------------------------------------------------

AWS also provides Reserved Instances and Savings Plans for sustained
workloads. Standard EC2 Reserved Instances can offer substantial
discounts compared with On-Demand pricing, but the discount depends on
commitment, term and payment model. citeturn0search2turn0search12

For a real city deployment, the cost model should therefore be revisited
after the workload is benchmarked.

------------------------------------------------------------------------

# 10. Version 1 --- Total Edge Architecture

## Year 1

  Category                                              Cost
  ----------------------------- ----------------------------
  Edge AI hardware CAPEX                   **\~₹26.3 crore**
  Edge electricity                                \~₹35 lakh
  LTE backup                                      \~₹36 lakh
  Hardware maintenance/spares                   \~₹2.0 crore
  Common backend                           \~₹12.2 lakh/year
  **Calculated Year-1 total**     **\~₹29.13 crore + usage**

The earlier project estimate of **\~₹29.8 crore** is therefore a
conservative rounded figure.

The direct arithmetic of the displayed assumptions is approximately
**₹29.13 crore**, not ₹29.8 crore:

``` text
₹26.30 crore
+ ₹0.35 crore
+ ₹0.36 crore
+ ₹2.00 crore
+ ₹0.122 crore
────────────────
≈ ₹29.13 crore
```

For proposal purposes:

> **Budget envelope: \~₹29--30 crore for Year 1**

is more defensible than presenting ₹29.8 crore as a precise number.

## Recurring Years

Once the hardware has been purchased:

  Recurring category                            Annual cost
  ------------------------ --------------------------------
  Electricity                                    \~₹35 lakh
  LTE backup                                     \~₹36 lakh
  Maintenance/spares                           \~₹2.0 crore
  Common backend                       \~₹12.2 lakh + usage
  **Recurring baseline**     **\~₹2.83 crore/year + usage**

------------------------------------------------------------------------

# 11. Version 2 --- Central AI Without Per-Camera Hardware

The alternative removes the per-camera AI computer.

``` text
CCTV Cameras
     │
     │ Continuous video
     ▼
Central Video Ingestion
     │
     ▼
Central GPU Cluster
     │
     ▼
VehicleObservation
     │
     ▼
Regional / Global Backend
```

There is essentially no camera-side AI CAPEX.

However, this moves the burden to:

-   central GPU capacity
-   video transport
-   video decoding
-   network infrastructure
-   central power/compute
-   central failure domains

------------------------------------------------------------------------

# 12. Central GPU Reference

The previous project evaluation uses:

**Amazon EC2 `g4dn.xlarge`**

AWS specifies `g4dn.xlarge` as:

-   1 × NVIDIA T4 GPU
-   4 vCPUs
-   16 GiB RAM
-   125 GB NVMe SSD

citeturn2search4turn2search3

The project planning figure is:

**\~₹4.85 lakh/GPU/year**

This corresponds to the approximate USD/INR conversion used in the
earlier evaluation and continuous 24 × 7 operation.

The exact AWS charge depends on Region, purchase model, operating system
and utilization. AWS's official EC2 pricing page should therefore be
treated as the authoritative pricing reference. citeturn1search1

------------------------------------------------------------------------

# 13. Central AI GPU Scenarios

    GPU capacity Calculation             Approx. annual GPU cost
  -------------- --------------------- -------------------------
         10 GPUs 10 × `g4dn.xlarge`                 \~₹48.5 lakh
         25 GPUs 25 × `g4dn.xlarge`                \~₹1.21 crore
         50 GPUs 50 × `g4dn.xlarge`                \~₹2.43 crore
        100 GPUs 100 × `g4dn.xlarge`               \~₹4.85 crore

Adding the common backend baseline of \~₹12.2 lakh/year gives:

  Architecture          GPU cost   Common backend          Total/year
  -------------- --------------- ---------------- -------------------
  10 GPU            \~₹48.5 lakh     \~₹12.2 lakh    **\~₹60.7 lakh**
  25 GPU           \~₹1.21 crore     \~₹12.2 lakh   **\~₹1.33 crore**
  50 GPU           \~₹2.43 crore     \~₹12.2 lakh   **\~₹2.55 crore**
  100 GPU          \~₹4.85 crore     \~₹12.2 lakh   **\~₹4.97 crore**

These are **capacity scenarios, not claims that a particular GPU count
can process 1,000 cameras**.

The correct GPU count must be established through an inference benchmark
using the actual:

-   camera resolution
-   frame rate
-   sampling rate
-   detector
-   tracker
-   plate detector
-   OCR model
-   enhancement pipeline
-   number of simultaneous vehicles
-   batching strategy

------------------------------------------------------------------------

# 14. Central AI CAPEX vs OPEX

With AWS, central AI is primarily OPEX:

  Item                                              CAPEX   OPEX
  -------------------------------- ---------------------- ------
  Per-camera AI hardware                               ₹0     ₹0
  AWS GPU                                              ₹0    Yes
  EC2 backend                                          ₹0    Yes
  RDS                                                  ₹0    Yes
  Cache                                                ₹0    Yes
  Redpanda                                             ₹0    Yes
  S3                                                   ₹0    Yes
  Camera-side electricity for AI                       ₹0     ₹0
  Central infrastructure             ₹0 hardware purchase    Yes

This is one of the strongest financial advantages of the centralized
architecture for an initial deployment.

------------------------------------------------------------------------

# 15. Central AI's Hidden Cost: Video Transport

The central-AI numbers above **do not include the full cost of
transporting continuous CCTV video to the cloud**.

This is potentially the largest omitted variable.

For example, at an illustrative **4 Mbps per camera**:

  Metric                  1 camera   1,000 cameras
  -------------------- ----------- ---------------
  Continuous bitrate        4 Mbps          4 Gbps
  Data/day               \~43.2 GB       \~43.2 TB
  Data/month             \~1.30 TB       \~1.30 PB

These are engineering calculations, not cloud-provider prices.

The implication is more important than the exact number:

``` text
1,000 cameras
      │
      │ Continuous video
      ▼
~4 Gbps sustained upstream
      │
      ▼
Very large network requirement
```

Therefore:

> **The central-AI cost table must not be interpreted as a complete
> production quote.**

It is a compute/backend comparison.

Actual metropolitan deployment would require a separate network design
covering:

-   CCTV-to-processing connectivity
-   private fiber
-   ISP/MPLS/private WAN
-   VPN
-   internet egress
-   redundancy
-   video transport protocols
-   ingress bandwidth
-   data transfer charges

------------------------------------------------------------------------

# 16. Edge vs Central --- Cost Comparison

  -----------------------------------------------------------------------
  Factor                  Per-camera Edge AI      Central AI
  ----------------------- ----------------------- -----------------------
  Camera-side compute     High                    None

  Initial CAPEX           **Very high**           **Very low**

  Cloud GPU OPEX          Lower                   Higher

  Continuous video        Much lower              **Very high**
  transport                                       

  Local buffering         Native                  Requires network
                                                  continuity or local
                                                  recorder

  Camera-level failure    **Excellent**           Lower
  isolation                                       

  Per-node telemetry      **Excellent**           More dependent on
                                                  camera/network
                                                  infrastructure

  Offline operation       **Yes**                 No, unless local
                                                  buffering exists

  Central GPU scaling     Lower requirement       **Primary scaling
                                                  mechanism**

  Hardware maintenance    High                    Low

  Software deployment     Distributed             Centralized

  OTA management          Required across nodes   Simpler

  Camera-specific         Local                   Central infrastructure
  calibration                                     

  Data sovereignty        Can retain processing   Video reaches central
                          locally                 infrastructure

  Physical deployment     High                    Lower
  complexity                                      

  Network dependency      Event transport         **Continuous video
                                                  transport**

  Long-term distributed   **Strong**              Requires additional
  resilience                                      infrastructure
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 17. Five-Year Cost Perspective

A CAPEX-heavy architecture should not be compared with one year's OPEX
alone.

Assume, purely for planning, a **5-year edge hardware service life**.

## Edge

  Component                                       Year 1      Years 2--5              5-year total
  ----------------------------- ------------------------ --------------- -------------------------
  Edge hardware CAPEX                           ₹26.3 cr             ---                  ₹26.3 cr
  Edge OPEX                                ₹2.71 cr/year   ₹2.71 cr/year                 ₹13.55 cr
  Common backend                  ₹0.122 cr/year + usage            Same        \~₹0.61 cr + usage
  **Approx. 5-year baseline**                                              **\~₹40.46 cr + usage**

## Central AI --- 10 GPU scenario

  Component                                      Annual           5-year
  ------------------------------ ---------------------- ----------------
  10 × `g4dn.xlarge`                        \~₹0.485 cr       \~₹2.43 cr
  Common backend                            \~₹0.122 cr       \~₹0.61 cr
  **Compute/backend subtotal**     **\~₹0.607 cr/year**   **\~₹3.04 cr**

The central figure still excludes the major cost of metropolitan video
transport.

Therefore:

> **The edge architecture is dramatically more expensive in hardware,
> while the central architecture is dramatically more dependent on
> network and cloud GPU capacity.**

------------------------------------------------------------------------

# 18. Why the Cheaper Architecture Is Not Automatically the Better Architecture

Pure financial comparison favors central AI when the video network is
assumed to be free and sufficiently capable.

That assumption is unrealistic for a large metropolitan deployment.

The actual comparison is closer to:

``` text
EDGE

Camera
  │
  ▼
AI Hardware
  │
  │ Small events
  ▼
Backend

Cost:
Hardware + electricity + maintenance
```

versus:

``` text
CENTRAL

Camera
  │
  │ Continuous video
  ▼
Network
  │
  ▼
Cloud GPU
  │
  ▼
Backend

Cost:
Network + GPU + cloud infrastructure
```

The network therefore becomes an important part of the economic model.

------------------------------------------------------------------------

# 19. Recommended Deployment Strategy

For the project itself, the most defensible approach is:

## Phase 1 --- Centralized AI

``` text
Existing CCTV
      │
      ▼
Central GPU
      │
      ▼
VehicleObservation
      │
      ▼
Regional Backend
      │
      ▼
Global Backend
```

Advantages:

-   lower initial hardware investment
-   easier development
-   easier model iteration
-   centralized model deployment
-   easier debugging
-   appropriate for the project prototype

## Phase 2 --- Selective Edge Deployment

Move only high-value cameras to edge processing.

``` text
Normal Cameras ───────► Central AI

High-value / remote /
bandwidth-constrained
cameras
       │
       ▼
Edge AI
       │
       ▼
Regional Backend
```

This provides a hybrid architecture.

## Phase 3 --- Large-Scale Edge

Deploy dedicated nodes where:

-   network bandwidth is expensive
-   camera sites are remote
-   continuous cloud video is impractical
-   low-latency processing matters
-   local autonomy is required
-   camera-level reliability is important

------------------------------------------------------------------------

# 20. Hybrid Architecture

The most practical metropolitan architecture may eventually be:

``` text
                         REGIONAL BACKEND
                               ▲
                  ┌────────────┴────────────┐
                  │                         │
             Vehicle Events            Vehicle Events
                  │                         │
             Edge Cameras             Central Cameras
                  ▲                         ▲
                  │                         │
             Edge AI Nodes             Network Video
                  ▲                         ▲
                  │                         │
              CCTV Group A            CCTV Group B
```

The backend does not need to care whether an observation came from:

-   an edge GPU
-   a centralized GPU
-   a simulator
-   a replay system

All of them produce the same `VehicleObservation` contract.

------------------------------------------------------------------------

# 21. Costs Not Included

The following should **not** be silently included in the headline totals
because their price depends heavily on the deployment:

  -----------------------------------------------------------------------
  Cost                                Why excluded
  ----------------------------------- -----------------------------------
  Existing CCTV cameras               Assumed already deployed

  Camera poles/mounts                 Site-specific

  Fiber installation                  Requires survey/tender

  ISP/MPLS/private WAN                Contract-specific

  Internet egress                     Depends on video/event volume

  Cloud video ingress/processing      Depends on architecture

  GPU benchmark overprovisioning      Cannot be known before testing

  Field installation labor            Number/location of sites unknown

  Civil/electrical work               Site-specific

  Air conditioning/data-center        Depends on central facility
  infrastructure                      

  Security monitoring                 Depends on organizational
                                      requirements

  Human operators                     Staffing model not defined

  Legal/compliance expenditure        Jurisdiction and procurement
                                      dependent

  Insurance                           Procurement dependent

  Taxes/GST                           Vendor/billing dependent

  Camera replacement                  Existing camera fleet condition
                                      unknown
  -----------------------------------------------------------------------

These are not negligible in a real municipal procurement. They should be
added during a detailed DPR/RFP stage.

------------------------------------------------------------------------

# 22. Budget Sensitivity

The most important variables are:

  Variable                  Edge sensitivity   Central sensitivity
  ----------------------- ------------------ ---------------------
  Number of cameras            **Very high**                  High
  GPU workload                           Low         **Very high**
  Video bitrate                          Low         **Very high**
  Network price                       Medium         **Very high**
  Edge hardware price          **Very high**                  None
  Electricity                         Medium                Medium
  Hardware failure rate             **High**                   Low
  LTE usage                           Medium                  None
  AI model complexity                 Medium         **Very high**
  Storage retention                   Medium                  High
  Evidence-image volume               Medium                  High

------------------------------------------------------------------------

# 23. Budget Ranges for a Metropolitan City

The 1,000-camera baseline can be scaled approximately.

### Edge hardware

    Cameras   Approx. edge CAPEX at ₹2.63 lakh/node
  --------- ---------------------------------------
        100                           \~₹2.63 crore
        250                           \~₹6.58 crore
        500                          \~₹13.15 crore
      1,000                       **\~₹26.3 crore**
      2,500                           \~₹65.8 crore
      5,000                          \~₹131.5 crore
     10,000                            \~₹263 crore

This linear model is useful for early planning but does not include
volume discounts or changes in hardware specification.

### Central GPU

    GPU count   Approx. annual GPU cost
  ----------- -------------------------
            5              \~₹24.3 lakh
           10              \~₹48.5 lakh
           25             \~₹1.21 crore
           50             \~₹2.43 crore
          100             \~₹4.85 crore
          250             \~₹12.1 crore

Again, this is **not a camera-to-GPU capacity conversion**.

------------------------------------------------------------------------

# 24. Cost Interpretation

The project should present the two architectures as different economic
models rather than claiming one universal price.

### Per-camera Edge AI

**High CAPEX + moderate distributed OPEX**

``` text
Pay more initially
       ↓
Process locally
       ↓
Transmit compact events
       ↓
Reduce network dependence
       ↓
Gain node-level resilience
```

### Central AI

**Low CAPEX + centralized compute/network OPEX**

``` text
Avoid camera-side hardware
       ↓
Centralize AI
       ↓
Simplify deployment
       ↓
Pay for GPU + network
       ↓
Scale central infrastructure
```

------------------------------------------------------------------------

# 25. Final Recommended Budget

For a **1,000-camera metropolitan demonstration/deployment model**:

  --------------------------------------------------------------------------
  Architecture                   CAPEX     Recurring annual Practical budget
                                                       cost interpretation
  --------------- -------------------- -------------------- ----------------
  **Per-camera       **\~₹26.3 crore**            **\~₹2.83 \~₹29--30 crore
  Edge AI**                            crore/year + usage** Year 1

  **Central AI               **Near ₹0            **\~₹60.7 Lowest initial
  --- 10 GPUs**          camera-side**          lakh/year + infrastructure
                                              video-network cost
                                                    usage** 

  **Central AI     Near ₹0 camera-side            **\~₹1.33 Medium compute
  --- 25 GPUs**                                crore/year + capacity
                                              video-network 
                                                    usage** 

  **Central AI     Near ₹0 camera-side            **\~₹2.55 Large
  --- 50 GPUs**                                crore/year + centralized
                                              video-network deployment
                                                    usage** 

  **Central AI     Near ₹0 camera-side            **\~₹4.97 Very large
  --- 100 GPUs**                               crore/year + centralized
                                              video-network deployment
                                                    usage** 
  --------------------------------------------------------------------------

The central figures should be described as **cloud compute/backend
budgets, not complete city deployment costs**, because continuous video
transport can become a major additional expenditure.

------------------------------------------------------------------------

# 26. Procurement Principle

No component should be treated as a permanent price.

For procurement, every budget line should eventually be replaced by:

``` text
Exact Model
     ↓
Current Indian Supplier
     ↓
Quantity Quote
     ↓
GST Treatment
     ↓
Installation Cost
     ↓
Warranty
     ↓
Annual Maintenance
     ↓
Final TCO
```

For AWS:

``` text
Exact Service
     ↓
Region
     ↓
Instance / Storage Size
     ↓
Expected Utilization
     ↓
Data Transfer
     ↓
Purchase Model
     ↓
AWS Pricing Calculator
     ↓
Final Monthly Bill
```

This is particularly important for the GPU count and central
video-network cost, which cannot be responsibly fixed before real
inference and bandwidth benchmarks.

------------------------------------------------------------------------

# 27. Final Cost Principle

The core economic trade-off of traffIQ is:

> **Central AI minimizes physical hardware expenditure but increases
> dependence on central compute and continuous video networking.
> Per-camera edge AI increases CAPEX but converts each camera into an
> autonomous, locally resilient processing node and dramatically reduces
> the amount of data that must traverse the network.**

For the initial project, **centralized AI is the financially and
operationally appropriate baseline**.

Per-camera hardware should remain a **future deployment option**,
particularly for high-value, remote, bandwidth-constrained or
reliability-critical camera locations.

The architecture should therefore be designed so that either deployment
model produces the same:

``` text
VehicleObservation
        ↓
Message Bus
        ↓
Regional Backend
        ↓
Global Backend
        ↓
GIS Dashboard
```

This keeps the software investment independent of the eventual hardware
deployment strategy.
