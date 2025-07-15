import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import data from "./data.js";

dotenv.config();

const app = express();

const API_KEY = process.env.API_KEY;
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.post("/api/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  if (prompt.length > 300) {
    return res.status(400).json({
      error: "Prompt is too long. Please limit the prompt to 300 characters.",
    });
  }

  const keywords = prompt.toLowerCase().split(" ");
  let systemPrompts = data
    .filter((item) =>
      item.tags?.split(" ").some((tag) => keywords.includes(tag))
    )
    .map((item) => item.content);

  const chatbotInfoItem = data.find(
    (item) => item.name === "Chatbot Information"
  );
  const chatbotInfo = chatbotInfoItem ? chatbotInfoItem.content : "";

  if (chatbotInfo) {
    systemPrompts.unshift(chatbotInfo);
  }

  if (systemPrompts.length === 1 && chatbotInfo) {
    systemPrompts = data.map((item) => item.content);
  }

  console.log(
    "Selected object names:",
    data
      .filter((item) =>
        item.tags?.split(" ").some((tag) => keywords.includes(tag))
      )
      .map((item) => item.name)
  );

  try {
    const messages = [
      {
        role: "system",
        content:
          "You are Sigmud, a programming chatbot created by Chin, dedicated to addressing Sigma School or tech-related issues. Always respond in a friendly, casual manner.",
      },
      ...systemPrompts.map((content) => ({ role: "system", content })),
      { role: "user", content: prompt },
    ];

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages,
        max_tokens: 500,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );

    const { prompt_tokens, completion_tokens, total_tokens } =
      response.data.usage;

    const reply = response.data.choices[0].message.content;

    res.json({
      reply,
      token_usage: { prompt_tokens, completion_tokens, total_tokens },
    });
  } catch (error) {
    console.error("Error communicating with OpenAI API: ", error.message);
    res.status(500).json({ error: "Failed to fetch response from OpenAI API" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost: ${PORT}`);
});

console.log(`API Key: ${API_KEY}`);
