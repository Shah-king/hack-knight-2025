import express from "express";
import recallService from "../services/recallService.js";

const router = express.Router();

/**
 * Recall.ai Webhook Endpoint
 * POST /api/webhooks/recall
 *
 * Receives real-time events from Recall.ai, including transcript segments.
 * This replaces polling with push-based notifications for production.
 *
 * @see https://docs.recall.ai/docs/webhooks
 */
router.post("/recall", async (req, res) => {
  // Immediately acknowledge receipt
  res.sendStatus(200);

  try {
    const event = req.body;

    console.log("📥 Received Recall.ai webhook event:", event.event);

    // Handle transcript segment events
    if (event.event === "transcript.segment") {
      const { data } = event;

      if (!data) {
        console.warn("⚠️ Transcript segment event missing data");
        return;
      }

      const botId = data.bot_id;
      const segment = data.segment;

      if (!botId || !segment) {
        console.warn("⚠️ Transcript segment missing botId or segment data");
        return;
      }

      // Get bot info to retrieve userId
      const botInfo = recallService.activeBots.get(botId);

      if (!botInfo) {
        console.warn(`⚠️ Received transcript for unknown bot: ${botId}`);
        return;
      }

      const userId = botInfo.userId;

      // Extract transcript data
      const speaker = segment.speaker || "Unknown";
      const text = segment.text || segment.words?.map(w => w.text).join(' ') || "";
      const isFinal = segment.is_final !== false; // Default to true
      const timestamp = segment.start_time
        ? new Date(segment.start_time)
        : new Date();

      console.log(
        `📝 Transcript segment - Bot: ${botId}, Speaker: ${speaker}, Text: "${text}"`
      );

      // Emit transcript event matching the WebSocket signature
      recallService.emit("transcript", {
        botId,
        userId,
        speaker,
        text,
        isFinal,
        timestamp,
        confidence: segment.confidence || 1.0,
      });
    } else if (event.event === "bot.status_change") {
      // Handle bot status changes
      const { data } = event;
      const botId = data?.bot_id;
      const status = data?.status?.code;

      if (botId && status) {
        console.log(`🤖 Bot ${botId} status changed to: ${status}`);

        // Update local cache
        if (recallService.activeBots.has(botId)) {
          recallService.activeBots.get(botId).status = status;
        }

        // Emit status change event
        recallService.emit("bot-status-changed", { botId, status });
      }
    } else {
      // Log other events for debugging
      console.log(`ℹ️ Unhandled webhook event: ${event.event}`);
    }
  } catch (error) {
    console.error("❌ Error processing Recall.ai webhook:", error);
    // Don't throw - we already sent 200 response
  }
});

export default router;
