export interface BodyMeasurement {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPercentage?: number;
  measurements?: {
    neck?: number;
    shoulders?: number;
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  notes?: string;
}

export interface ProgressPhoto {
  id: string;
  date: string;   // YYYY-MM-DD
  dataUrl: string; // base64 data URL, e.g. "data:image/jpeg;base64,..."
}
