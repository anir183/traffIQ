import type { Incident } from "../../types/traffic";

export const INCIDENTS: Incident[] = [
  {
    id: "1",
    icon: "alert",
    title: "Blacklisted Vehicle",
    detail: "WB02AM7555",
    location: "Park Street",
    time: "14:28",
    status: "Active",
  },
  {
    id: "2",
    icon: "warning",
    title: "Accident",
    detail: "Multiple vehicles",
    location: "EM Bypass",
    time: "14:15",
    status: "Active",
  },
  {
    id: "3",
    icon: "alert",
    title: "Speed Violation",
    detail: "DLBCAX1234",
    location: "VIP Road",
    time: "13:52",
    status: "Investigating",
  },
  {
    id: "4",
    icon: "wrongway",
    title: "Wrong Way",
    detail: "Unknown Vehicle",
    location: "Sector V",
    time: "13:45",
    status: "Investigating",
  },
  {
    id: "5",
    icon: "wrongway",
    title: "Route Anomaly",
    detail: "MH01AB9876",
    location: "New Town",
    time: "12:30",
    status: "Resolved",
  },
  {
    id: "6",
    icon: "warning",
    title: "Signal Malfunction",
    detail: "Intersection A12",
    location: "Howrah Bridge",
    time: "14:05",
    status: "Active",
  },
  {
    id: "7",
    icon: "alert",
    title: "Blacklisted Vehicle",
    detail: "HR26DD2233",
    location: "Salt Lake",
    time: "14:02",
    status: "Active",
  },
  {
    id: "8",
    icon: "warning",
    title: "Accident",
    detail: "Two-wheeler down",
    location: "AJC Bose Road",
    time: "13:40",
    status: "Investigating",
  },
  {
    id: "9",
    icon: "alert",
    title: "Speed Violation",
    detail: "WB01BB5566",
    location: "Kona Expressway",
    time: "13:31",
    status: "Investigating",
  },
  {
    id: "10",
    icon: "warning",
    title: "Road Construction",
    detail: "Lane closure",
    location: "Ballygunge",
    time: "12:15",
    status: "Resolved",
  },
  {
    id: "11",
    icon: "warning",
    title: "Signal Malfunction",
    detail: "Intersection B7",
    location: "Park Circus",
    time: "11:58",
    status: "Resolved",
  },
  {
    id: "12",
    icon: "wrongway",
    title: "Wrong Way",
    detail: "Unknown Vehicle",
    location: "Dhakuria",
    time: "13:58",
    status: "Active",
  },
  {
    id: "13",
    icon: "wrongway",
    title: "Route Anomaly",
    detail: "MH02CX8899",
    location: "City Centre",
    time: "13:20",
    status: "Investigating",
  },
  {
    id: "14",
    icon: "warning",
    title: "Accident",
    detail: "Minor collision",
    location: "Ruby More",
    time: "11:30",
    status: "Resolved",
  },
  {
    id: "15",
    icon: "alert",
    title: "Speed Violation",
    detail: "DL4MA9900",
    location: "Ballygunge Phari",
    time: "13:50",
    status: "Active",
  },
];

export function getRecentIncidents(count: number): Incident[] {
  return INCIDENTS.filter((i) => i.status === "Active")
    .sort((a, b) => b.time.localeCompare(a.time))
    .slice(0, count);
}

export function getActiveCount(): number {
  return INCIDENTS.filter((i) => i.status === "Active").length;
}
