import "dotenv/config";
import * as sdk from "matrix-js-sdk";
import { RoomEvent, ClientEvent } from "matrix-js-sdk";
import handleMessage from "./messages";
import handleReaction from "./reactions";

// Check for required environment variables
const requiredEnvVars = [
  "MATRIX_HOMESERVER_URL",
  "MATRIX_ACCESS_TOKEN",
  "MATRIX_USER_ID",
  "MONITORED_ROOM_ID",
  "FORWARDING_ROOM_ID",
  "AI_API_KEY"
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in environment variables`);
    process.exit(1);
  }
}

// Optional environment variables with defaults
if (!process.env.AI_API_URL) {
  console.log("AI_API_URL not set, using default OpenAI API URL");
}

if (!process.env.AI_MODEL) {
  console.log("AI_MODEL not set, using default 'gpt-3.5-turbo' model");
}

const client = sdk.createClient({
  baseUrl: process.env.MATRIX_HOMESERVER_URL,
  accessToken: process.env.MATRIX_ACCESS_TOKEN,
  userId: process.env.MATRIX_USER_ID,
});

const start = async () => {
  await client.startClient();

  client.once(ClientEvent.Sync, async (state, prevState, res) => {
    // state will be 'PREPARED' when the client is ready to use
    console.log(`Client sync state: ${state}`);
    console.log(`Listening for messages in room: ${process.env.MONITORED_ROOM_ID}`);
    console.log(`Forwarding links to room: ${process.env.FORWARDING_ROOM_ID}`);
  });

  const scriptStart = Date.now();

  client.on(
    RoomEvent.Timeline,
    async function (event, room, toStartOfTimeline) {
      const eventTime = event.event.origin_server_ts;

      if (scriptStart > eventTime) {
        return; //don't run commands for old messages
      }

      if (event.event.sender === process.env.MATRIX_USER_ID) {
        return; // don't reply to messages sent by the tool
      }

      if (event.event.room_id !== process.env.MONITORED_ROOM_ID) {
        return; // don't activate unless in the active room
      }

      if (
        event.getType() !== "m.room.message" &&
        event.getType() !== "m.reaction"
      ) {
        console.log("skipping event:", event);
        return; // only use messages or reactions
      }

      if (event.getType() === "m.room.message") handleMessage(event);

      if (event.getType() === "m.reaction") handleReaction(event);
    }
  );
};

start();
