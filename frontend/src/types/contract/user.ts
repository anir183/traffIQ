export type UserRole = "admin" | "operator" | "viewer";

export interface User {
  user_id: string;
  email: string;
  full_name: string;
  department: string;
  role: UserRole;
  avatar_url?: string;
  active: boolean;
}
