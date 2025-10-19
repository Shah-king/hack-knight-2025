import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const RECALL_API_KEY = process.env.RECALL_API_KEY;
const RECALL_REGION = process.env.RECALL_REGION || "us-west-2";

console.log("🔑 Testing Recall.ai API...");
console.log("Region:", RECALL_REGION);
console.log(
  "API Key:",
  RECALL_API_KEY ? `${RECALL_API_KEY.substring(0, 10)}...` : "❌ MISSING"
);

async function testCreateBot() {
  const testPayload = {
    meeting_url: "https://meet.google.com/yse-nxfw-fdo", // Fake URL for testing
    bot_name: "Test Bot",
    recording_config: {
      transcript: {
        provider: {
          recallai_streaming: {},
        },
      },
    },
  };

  console.log("\n📤 Test Payload:");
  console.log(JSON.stringify(testPayload, null, 2));

  try {
    const response = await axios.post(
      `https://${RECALL_REGION}.recall.ai/api/v1/bot`,
      testPayload,
      {
        headers: {
          Authorization: `Token ${RECALL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("\n✅ Success! Bot Created:");
    console.log("Bot ID:", response.data.id);
    console.log("Status:", response.data.status);
    console.log("\nFull Response:");
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error("\n❌ Error:");
    console.error("Status:", error.response?.status);
    console.error("Status Text:", error.response?.statusText);
    console.error("Error Data:", JSON.stringify(error.response?.data, null, 2));
    console.error("Request URL:", error.config?.url);
    console.error("Request Headers:", error.config?.headers);
  }
}

testCreateBot();
