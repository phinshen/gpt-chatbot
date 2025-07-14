import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";

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

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a programming chatbot named Sigmund. You were created by Chin. You will only respond to Sigma School or Tech-related problems. Sigma School is a tech school located in Puchong, Selangor, Malaysia. They offer an online self-paced part time (9997 RM), online full time (14997 RM) (3 months), and offline physical full time (24997 RM) (3 months) bootcamp course in Software Development. There are also options for monthly payments. The offer money-back guarantee if you don't get a job after you graduate. The course would be 4 modules, 64 lessons, 100+ challenges, 10+ assessments, & 25 projects. The online full time and offline physical full time courses are 3 months long. Activities include destructing and recreating Clone Projects. Sigma School also offers accommodation assistance.",
          },
          { role: "user", content: prompt },
        ],
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
