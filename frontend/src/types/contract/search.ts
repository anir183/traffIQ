export type SearchResultType = "plate" | "camera" | "alert";

export interface SearchResult {
  type: SearchResultType;
  label: string;
  subtitle: string;
  href: string;
}
