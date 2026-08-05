// Node.js: Process a telemetry message.

/**
 * @typedef {Object} Message
 * @property {string} device_id
 * @property {string} metric
 * @property {number} value
 * @property {number} timestamp
 */

/**
 * @typedef {Object} Result
 * @property {string} device_id
 * @property {number} average
 * @property {string} processed
 */

/**
 * Process a telemetry message.
 * @param {Message} msg
 * @returns {Result}
 */
function processMessage(msg) {
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
console.log("🔧 Node.js: Starting polyglot example");

const port = process.env.PORT || "8080";
console.log(`📋 Config: server port = ${port}`);

const msg = {
  device_id: "sensor-001",
  metric: "temperature",
  value: 24.5,
  timestamp: Math.floor(Date.now() / 1000),
};

const result = processMessage(msg);
console.log(`✅ Result: ${JSON.stringify(result, null, 2)}`);

console.log("🔚 Node.js: Done");
