const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { fal } =require('@fal-ai/client');
const app = express();
const port = 3000;
require('dotenv').config();
app.use(cors());
app.use(express.json());

fal.config({
    credentials: process.env.IMAGE_KEY,
  });
  const API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
console.log(API_KEY);
app.post("/generate-image", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        const result = await fal.subscribe("fal-ai/flux/dev", {
            input: { prompt },
        });

        console.log("Full API Response:", JSON.stringify(result)); // Log response for debugging

        // Ensure images array exists and has at least one object
        if (!result?.data?.images || !Array.isArray(result.data.images) || result.data.images.length === 0) {
            return res.status(500).json({ error: "No images found in response" });
        }

        // Extract first image object (fix for [Object])
        const imageObject = result.data.images[0]; // This is likely an object

        console.log("Extracted Image Object:", imageObject); // Debug

        // If the image object is valid, return its URL
        if (imageObject && typeof imageObject === "object") {
            const imageUrl = imageObject.url || Object.values(imageObject)[0]; // Adjust if `url` key is different

            if (imageUrl) {
                return res.json({ success: true, imageUrl });
            }
        }

        res.status(500).json({ error: "Image URL not found" });

    } catch (error) {
        console.error("Error generating image:", error);
        res.status(500).json({ error: "Failed to generate image" });
    }
});



app.post('/ask', async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(query);

        res.json({ response: result.response.text() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
