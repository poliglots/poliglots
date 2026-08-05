import { create } from "zustand";

interface Device {
  id: string;
  name: string;
  type: string;
  status: "online" | "offline" | "warning";
  lastSeen: string;
}

interface DeviceState {
  devices: Device[];
  selectedDevice: string | null;
  setDevice: (id: string) => void;
  loadDevices: () => Promise<void>;
}

export const useDeviceStore = create<DeviceState>((set) => ({
  devices: [],
  selectedDevice: null,

  setDevice: (id: string) => set({ selectedDevice: id }),

  loadDevices: async () => {
    try {
      const res = await fetch("http://localhost:8080/api/v1/devices");
      const devices = await res.json();
      set({ devices, selectedDevice: devices[0]?.id ?? null });
    } catch (err) {
      console.error("Failed to load devices:", err);
    }
  },
}));
