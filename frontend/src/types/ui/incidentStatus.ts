import type { AlertStatus } from "../contract/alert";
import type { IncidentStatus, VehicleType } from "../traffic";
import type { VehicleClass } from "../contract/anprEvent";

export function alertStatusToUi(status: AlertStatus): IncidentStatus {
  switch (status) {
    case "active":
      return "Active";
    case "investigating":
      return "Investigating";
    case "resolved":
      return "Resolved";
  }
}

export function vehicleClassToUi(type: VehicleClass): VehicleType {
  switch (type) {
    case "car":
      return "Car";
    case "truck":
      return "Truck";
    case "bike":
      return "Bike";
    case "bus":
      return "Bus";
    default:
      return "Car";
  }
}
