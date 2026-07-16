import dotenv from 'dotenv';
dotenv.config();

const VOICE_ID = "d0grukerEzs069eKIauC";

async function test() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  console.log("Starting test...");
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: "ہیلو، کیا حال ہے؟",
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error:", response.status, errorText);
    return;
  }

  console.log("Response OK. Parsing JSON...");
  const data = await response.json();
  console.log("JSON parsed successfully. Alignment keys:", Object.keys(data.alignment));
}

test().catch(console.error);
