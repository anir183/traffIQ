import type { Alert } from "../../types/contract/alert";
import { env } from "../env";
import { requestPaginated, toPaginatedResult } from "../http";
import type { PaginatedResult, RequestOptions } from "../http";
import type { AlertQuery } from "../mock/handlers";
import * as mock from "../mock/handlers";

export type AlertStatusFilter = "active" | "investigating" | "resolved";

export interface AlertFilter {
  status?: AlertStatusFilter;
  type?: string;
  severity?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export async function getAlerts(
  filter: AlertFilter = {},
  options: RequestOptions = {},
): Promise<PaginatedResult<Alert>> {
  if (env.dataSource === "mock") {
    const query: AlertQuery = {
      status: filter.status,
      type: filter.type,
      severity: filter.severity,
      from: filter.from,
      to: filter.to,
      limit: filter.limit,
      offset: filter.offset,
    };
    return toPaginatedResult(await mock.getAlerts(query));
  }
  return requestPaginated<Alert>(
    "/alerts",
    {
      status: filter.status,
      type: filter.type,
      severity: filter.severity,
      from: filter.from,
      to: filter.to,
      limit: filter.limit,
      offset: filter.offset,
      sort: "desc",
    },
    options,
  );
}
