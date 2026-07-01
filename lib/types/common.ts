export type EntityId = string;

export type ISO8601 = string;

export type Importance = "High" | "Medium" | "Low";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
