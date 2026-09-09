export interface ErrorRecord {
  id?: string | number;
  roNumber?: string;
  vin?: string;
  employeeName?: string;
  date?: string;
  category?: string;
  errorDescription?: string;
  severity?: "High" | "Medium" | "Low" | string;
  manager?: string;
  status?: string;
  [key: string]: any;
}

export interface TankLevel {
  lid: string;
  label: string;
  color: string;
  level: number;
  capacityGallons?: number;
  currentGallons?: number;
  status?: "OPTIMAL" | "ATTENTION" | "CRITICAL";
  lastRefill?: string;
}
