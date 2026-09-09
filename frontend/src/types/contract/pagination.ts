export interface PaginatedParams {
  limit?: number;
  offset?: number;
  sort?: "asc" | "desc";
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
