/**
 * TomTom Area Analytics — Report Creation
 * POST https://api.tomtom.com/areaanalytics/reports?key={Your_API_Key}
 *
 * Docs: "Report creation" (service version 1)
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Functional road classes (0 = highest, 8 = lowest). */
export type FRC = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Hour of day, 0–23. */
export type Hour =
  | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
  | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23;

export type AreaAnalyticsDataType =
  | 'NETWORK_LENGTH'
  | 'CONGESTION_LEVEL'
  | 'FREE_FLOW_SPEED'
  | 'TRAVEL_TIME'
  | 'SPEED';

/** GeoJSON geometry restricted to what the API accepts. */
export type AreaAnalyticsGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] };

export interface AreaAnalyticsFeatureProperties {
  /** Region name. Auto-generated if omitted. */
  name?: string;
  /** IANA timezone, e.g. "Europe/Amsterdam". Auto-generated if omitted. */
  timezone?: string;
}

export interface AreaAnalyticsFeature {
  type: 'Feature';
  properties: AreaAnalyticsFeatureProperties;
  geometry: AreaAnalyticsGeometry;
}

/**
 * Request body. Use either (startDate + endDate) OR (days) — not both.
 */
interface AreaAnalyticsReportBase {
  name: string;
  dataTypes: AreaAnalyticsDataType[];
  frcs: FRC[];
  hours: Hour[];
  features: AreaAnalyticsFeature[];
}

interface AreaAnalyticsReportByRange extends AreaAnalyticsReportBase {
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
  days?: never;
}

interface AreaAnalyticsReportByDays extends AreaAnalyticsReportBase {
  /** Specific YYYY-MM-DD dates to analyze. */
  days: string[];
  startDate?: never;
  endDate?: never;
}

export type AreaAnalyticsReportRequest =
  | AreaAnalyticsReportByRange
  | AreaAnalyticsReportByDays;

export interface AreaAnalyticsReportResponse {
  /** Report ID — use with the /results endpoint to fetch output (async processing). */
  id: string;
}

export interface AreaAnalyticsErrorResponse {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

export class AreaAnalyticsApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: AreaAnalyticsErrorResponse | string,
  ) {
    super(
      `TomTom Area Analytics API error (${status}): ${
        typeof body === 'string' ? body : JSON.stringify(body)
      }`,
    );
    this.name = 'AreaAnalyticsApiError';
  }
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export interface AreaAnalyticsClientOptions {
  apiKey: string;
  /** Defaults to "api.tomtom.com". Override for other environments. */
  baseUrl?: string;
  /** Optional custom fetch implementation (e.g. for Node < 18 or testing). */
  fetchImpl?: typeof fetch;
}

export class AreaAnalyticsClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: AreaAnalyticsClientOptions) {
    if (!options.apiKey) {
      throw new Error('AreaAnalyticsClient: apiKey is required');
    }
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? 'api.tomtom.com';
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  /**
   * Creates an Area Analytics report. Processing is asynchronous — use the
   * returned `id` to poll the `/results` endpoint.
   */
  async createReport(
    body: AreaAnalyticsReportRequest,
  ): Promise<AreaAnalyticsReportResponse> {
    this.validate(body);

    const url = `https://${this.baseUrl}/areaanalytics/reports?key=${encodeURIComponent(
      this.apiKey,
    )}`;

    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.status !== 201) {
      let errorBody: AreaAnalyticsErrorResponse | string;
      try {
        errorBody = (await response.json()) as AreaAnalyticsErrorResponse;
      } catch {
        errorBody = await response.text();
      }
      throw new AreaAnalyticsApiError(response.status, errorBody);
    }

    return (await response.json()) as AreaAnalyticsReportResponse;
  }

  private validate(body: AreaAnalyticsReportRequest): void {
    const hasRange = 'startDate' in body && body.startDate;
    const hasDays = 'days' in body && body.days;

    if (hasRange && hasDays) {
      throw new Error(
        'AreaAnalyticsClient: "days" cannot be used together with "startDate"/"endDate"',
      );
    }
    if (!hasRange && !hasDays) {
      throw new Error(
        'AreaAnalyticsClient: provide either ("startDate" and "endDate") or "days"',
      );
    }
    if (!body.features?.length) {
      throw new Error('AreaAnalyticsClient: "features" must contain at least one region');
    }
    if (!body.dataTypes?.length) {
      throw new Error('AreaAnalyticsClient: "dataTypes" must contain at least one value');
    }
  }
}

// ---------------------------------------------------------------------------
// Example usage
// ---------------------------------------------------------------------------

async function example() {
  const client = new AreaAnalyticsClient({
    apiKey: process.env.TOMTOM_API_KEY ?? '',
  });

  const report = await client.createReport({
    name: 'Amsterdam',
    startDate: '2024-08-06',
    endDate: '2024-08-06',
    frcs: [0, 1, 2, 3, 4, 5],
    hours: [7, 8],
    dataTypes: [
      'NETWORK_LENGTH',
      'CONGESTION_LEVEL',
      'FREE_FLOW_SPEED',
      'TRAVEL_TIME',
      'SPEED',
    ],
    features: [
      {
        type: 'Feature',
        properties: {
          name: 'Amsterdam',
          timezone: 'Europe/Amsterdam',
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [4.896128, 52.382402],
              [4.875701, 52.368459],
              [4.923611, 52.36341],
              [4.896128, 52.382402],
            ],
          ],
        },
      },
    ],
  });

  console.log('Report created, id:', report.id);
  // Next: poll GET /areaanalytics/reports/{id}/results?key=... until ready.
}

export { example };