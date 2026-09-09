import type { User } from "../../../types/contract/user";

export const USERS: User[] = [
  {
    user_id: "usr_demo",
    email: "admin@traffiq.in",
    full_name: "Rudraneel",
    department: "Traffic Control",
    role: "admin",
    active: true,
  },
  {
    user_id: "usr_002",
    email: "operator@traffiq.in",
    full_name: "Ananya Sen",
    department: "Traffic Control",
    role: "operator",
    active: true,
  },
  {
    user_id: "usr_003",
    email: "viewer@traffiq.in",
    full_name: "Rahul Das",
    department: "City Surveillance",
    role: "viewer",
    active: false,
  },
];

export const MOCK_USER: User = USERS[0];
