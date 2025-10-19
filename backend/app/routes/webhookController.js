import express from "express";
import recallService from "../services/recallService.js";
import recallDesktopService from "../services/recallDesktopService.js";

const router = express.Router();

/**
 * Recall.ai Webhook Endpoint
 * POST /api/webhooks/recall
 *
 * Receives real-time events from Recall.ai, including transcript segments.
 * This replaces polling with push-based notifications for production.
 *
 * Events handled:
 * - bot.status_change: Bot status updates (joining, in_call_recording, done, etc.)
 * - transcript.segment: Real-time transcription segments
 *
 * @see https://docs.recall.ai/docs/webhooks
 */
router.post("/recall", async (req, res) => {
  // Immediately acknowledge receipt (Recall.ai requires 200 response)
  res.sendStatus(200);

  try {
    const event = req.body;

    // Log all webhook events for debugging
    console.log("📥 Received Recall.ai webhook event:", event.event);
    console.log("   Payload:", JSON.stringify(event, null, 2));

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

      // CRITICAL: Real-time transcript logging as specified
      console.log(`[REAL-TIME TRANSCRIPT] ${speaker}: "${text}"`);

      // Also log additional metadata
      console.log(`   Bot ID: ${botId}`);
      console.log(`   Is Final: ${isFinal}`);
      console.log(`   Timestamp: ${timestamp.toISOString()}`);
      if (segment.confidence) {
        console.log(`   Confidence: ${segment.confidence}`);
      }

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

/**
 * Recall.ai Desktop SDK Upload Webhook Endpoint
 * POST /api/webhooks/recall-desktop
 *
 * Receives events from Recall.ai SDK Upload API when desktop recordings complete.
 *
 * Events handled:
 * - sdk_upload.complete: Upload completed successfully with transcripts
 * - sdk_upload.failed: Upload failed
 * - sdk_upload.uploading: Upload in progress (optional)
 *
 * @see https://docs.recall.ai/docs/sdk-upload
 */
router.post("/recall-desktop", async (req, res) => {
  // Immediately acknowledge receipt
  res.sendStatus(200);

  try {
    const event = req.body;

    // Log all webhook events for debugging
    console.log("📥 Received Desktop SDK webhook event:", event.event);
    console.log("   Payload:", JSON.stringify(event, null, 2));

    // Handle SDK upload completion
    if (event.event === "sdk_upload.complete") {
      const { data } = event;

      if (!data) {
        console.warn("⚠️ sdk_upload.complete event missing data");
        return;
      }

      console.log("✅ SDK Upload completed successfully");
      console.log(`   Upload ID: ${data.id}`);
      console.log(`   Status: ${data.status?.code || data.status}`);

      // Handle upload completion via Desktop service
      recallDesktopService.handleUploadCompleteWebhook(data);

      // Log transcripts if available
      if (data.transcripts && Array.isArray(data.transcripts)) {
        console.log(`   Transcripts: ${data.transcripts.length} segments`);

        // Log each transcript segment
        data.transcripts.forEach((transcript, index) => {
          const speaker = transcript.speaker || "Unknown";
          const text = transcript.text || transcript.words?.map(w => w.text).join(' ') || "";
          console.log(`   [${index + 1}] ${speaker}: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
        });
      }
    } else if (event.event === "sdk_upload.failed") {
      // Handle SDK upload failure
      const { data } = event;

      if (!data) {
        console.warn("⚠️ sdk_upload.failed event missing data");
        return;
      }

      console.error("❌ SDK Upload failed");
      console.error(`   Upload ID: ${data.id}`);
      console.error(`   Error: ${data.error || 'Unknown error'}`);

      // Handle upload failure via Desktop service
      recallDesktopService.handleUploadFailedWebhook(data);
    } else if (event.event === "sdk_upload.uploading") {
      // Handle upload in progress (optional)
      const { data } = event;

      if (data?.id) {
        console.log(`📤 SDK Upload in progress: ${data.id}`);

        // Update local cache if exists
        const upload = recallDesktopService.activeUploads.get(data.id);
        if (upload) {
          upload.status = 'uploading';
        }
      }
    } else {
      // Log other events for debugging
      console.log(`ℹ️ Unhandled desktop webhook event: ${event.event}`);
    }
  } catch (error) {
    console.error("❌ Error processing Desktop SDK webhook:", error);
    // Don't throw - we already sent 200 response
  }
});

export default router;
