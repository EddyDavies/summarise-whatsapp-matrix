import { sendMessage } from "./matrixClientRequests";

// Cache to prevent duplicates within a short time frame
const linkCache = new Set<string>();
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

// Regular expression to match URLs in text
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Extracts links from a message and forwards them to the target room
 */
export const extractAndForwardLinks = async (
  message: string,
  senderName: string,
  sourceRoomId: string
): Promise<void> => {
  if (!process.env.FORWARDING_ROOM_ID) {
    console.error("FORWARDING_ROOM_ID not set in environment variables");
    return;
  }

  const forwardingRoomId = process.env.FORWARDING_ROOM_ID;
  const links = message.match(URL_REGEX);

  if (!links || links.length === 0) {
    return;
  }

  for (const link of links) {
    const cacheKey = `${link}-${sourceRoomId}`;
    
    // Skip if link was recently forwarded
    if (linkCache.has(cacheKey)) {
      continue;
    }

    // Add to cache with expiration
    linkCache.add(cacheKey);
    setTimeout(() => {
      linkCache.delete(cacheKey);
    }, CACHE_EXPIRATION_MS);

    // Forward the link
    await sendMessage(
      forwardingRoomId,
      `Link shared by ${senderName} in another room:\n${link}`
    );
    
    console.log(`Forwarded link: ${link}`);
  }
}; 