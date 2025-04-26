import { sendMessage } from "./matrixClientRequests";
import { summarizeUrl } from "./summarizer";

// Cache to prevent duplicates within a short time frame
const linkCache = new Set<string>();
const CACHE_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour

// Regular expression to match URLs in text
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Extracts links from a message, summarizes them, and forwards them to the target room
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

    // Send initial message indicating link was found
    await sendMessage(
      forwardingRoomId,
      `Processing link shared by ${senderName}:\n${link}`
    );
    
    console.log(`Processing link: ${link}`);
    
    try {
      // Get summary for the link
      const summaryResult = await summarizeUrl(link);
      
      if (summaryResult) {
        // Send the summary
        await sendMessage(
          forwardingRoomId,
          `Summary of link shared by ${senderName}:\n\n${link}\n\n${summaryResult.summary}`
        );
        console.log(`Sent summary for link: ${link}`);
      } else {
        // Could not get summary
        await sendMessage(
          forwardingRoomId,
          `Could not generate summary for link shared by ${senderName}:\n${link}`
        );
        console.log(`Failed to generate summary for link: ${link}`);
      }
    } catch (error) {
      console.error(`Error processing link: ${link}`, error);
      await sendMessage(
        forwardingRoomId,
        `Error processing link shared by ${senderName}:\n${link}\n\nError: ${error}`
      );
    }
  }
}; 