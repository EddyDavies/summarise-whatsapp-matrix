import * as dotenv from "dotenv";

// Load environment variables from .env file
console.log("Loading environment variables...");
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  "MATRIX_HOMESERVER_URL",
  "MATRIX_ACCESS_TOKEN",
  "MATRIX_USER_ID",
  "FORWARDING_ROOM_ID"
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`Missing required environment variables: ${missingVars.join(", ")}`);
  console.warn("Tests requiring these variables may be skipped");
} else {
  console.log("All required environment variables are set");
} 