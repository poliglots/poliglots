const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface TelemetryResponse {
  device_id: string;
  metric: string;
  value: number;
  timestamp: string;
}

export async function getTelemetry(
  deviceId: string,
  durationMs: number = 3600000
): Promise<Array<{ time: string; temperature: number; humidity: number; pressure: number }>> {
  const from = new Date(Date.now() - durationMs).toISOString();
  const to = new Date().toISOString();

  const res = await fetch(
    `${API_BASE}/api/v1/telemetry/query?device=${deviceId}&from=${from}&to=${to}`
  );

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data: TelemetryResponse[] = await res.json();

  // Group and transform
  const grouped: Record<string, TelemetryResponse> = {};
  for (const point of data) {
    if (!grouped[point.timestamp]) {
      grouped[point.timestamp] = { ...point } as TelemetryResponse;
    }
    // Assign to appropriate field based on metric
    if (point.metric === "temperature") (grouped[point.timestamp] as any).temperature = point.value;
    if (point.metric === "humidity") (grouped[point.timestamp] as any).humidity = point.value;
    if (point.metric === "pressure") (grouped[point.timestamp] as any).pressure = point.value;
  }

  return Object.values(grouped).map((p) => ({
    time: new Date(p.timestamp).toLocaleTimeString(),
    temperature: (p as any).temperature ?? 0,
    humidity: (p as any).humidity ?? 0,
    pressure: (p as any).pressure ?? 0,
  }));
}

export async function getDevices() {
  const res = await fetch(`${API_BASE}/api/v1/devices`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function connectWebSocket(onMessage: (data: unknown) => void) {
  const ws = new WebSocket(`${API_BASE.replace("http", "ws")}/ws/telemetry`);
  ws.onmessage = (event) => onMessage(JSON.parse(event.data));
  return ws;
}
