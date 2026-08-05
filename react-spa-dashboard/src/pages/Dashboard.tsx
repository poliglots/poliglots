import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useDeviceStore } from "../stores/deviceStore";
import { getTelemetry } from "../services/api";

interface DataPoint {
  time: string;
  temperature: number;
  humidity: number;
  pressure: number;
}

export function Dashboard() {
  const [data, setData] = useState<DataPoint[]>([]);
  const { devices, selectedDevice } = useDeviceStore();

  useEffect(() => {
    const fetchTelemetry = async () => {
      if (!selectedDevice) return;
      const result = await getTelemetry(selectedDevice, 3600000); // 1hr
      setData(result);
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [selectedDevice]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">IoT Dashboard</h1>

      {/* Device Selector */}
      <div className="mb-6 flex gap-2">
        {devices.map((device) => (
          <button
            key={device.id}
            onClick={() => useDeviceStore.getState().setDevice(device.id)}
            className={`px-4 py-2 rounded ${
              selectedDevice === device.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {device.name}
          </button>
        ))}
      </div>

      {/* Telemetry Chart */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Telemetry (Real-time)</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="temperature" stroke="#ef4444" />
            <Line type="monotone" dataKey="humidity" stroke="#3b82f6" />
            <Line type="monotone" dataKey="pressure" stroke="#10b981" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <KPICard title="Temperature" value="24.5°C" trend="+0.3°C" />
        <KPICard title="Humidity" value="62%" trend="-1.2%" />
        <KPICard title="Pressure" value="1013 hPa" trend="+0.1 hPa" />
      </div>
    </div>
  );
}

function KPICard({ title, value, trend }: { title: string; value: string; trend: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
      <p className={`text-sm ${trend.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
        {trend}
      </p>
    </div>
  );
}
