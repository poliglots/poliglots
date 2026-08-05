/**
 * TypeScript: Process a telemetry message.
 */

interface Message {
  device_id: string;
  metric: string;
  value: number;
  timestamp: number;
}

interface Result {
  device_id: string;
  average: number;
  processed: string;
}

function processMessage(msg: Message): Result {
  console.log(`📊 Processing: device=${msg.device_id} metric=${msg.metric} value=${msg.value}`);

  // Simple transformation: round the value
  const average = Math.round(msg.value * 10) / 10;

  return {
    device_id: msg.device_id,
    average,
    processed: new Date().toISOString(),
  };
}

// Main
console.log("🔧 TypeScript: Starting polyglot example");

const port = process.env.PORT || "8080";
console.log(`📋 Config: server port = ${port}`);

const msg: Message = {
  device_id: "sensor-001",
  metric: "temperature",
  value: 24.5,
  timestamp: Math.floor(Date.now() / 1000),
};

const result: Result = processMessage(msg);
console.log(`✅ Result: ${JSON.stringify(result, null, 2)}`);

console.log("🔚 TypeScript: Done");
