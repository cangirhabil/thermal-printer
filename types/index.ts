export interface ConnectionType {
  id: string;
  name: string;
  icon: string;
  description: string;
  available: boolean;
}

export interface PrintJob {
  id: string;
  type: "image" | "text";
  content: string;
  timestamp: Date;
  status: "pending" | "printing" | "completed" | "failed";
  settings?: PrintSettings;
}

export interface PrintSettings {
  fontSize?: "small" | "normal" | "large" | "xlarge";
  alignment?: "left" | "center" | "right";
  bold?: boolean;
  copies?: number;
  cutPaper?: boolean;
}

export interface PrinterInfo {
  model: string;
  paperWidth: string;
  resolution: string;
  connectionType: string;
  status: "online" | "offline" | "error" | "busy";
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
