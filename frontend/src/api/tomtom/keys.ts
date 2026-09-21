import { API_KEY } from "../../config";

export function tomtomKeyIsSet(): boolean {
  return (
    typeof API_KEY === "string" && API_KEY !== "" && API_KEY !== "undefined"
  );
}

export function tomtomApiKey(): string {
  return API_KEY;
}
