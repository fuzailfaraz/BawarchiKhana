import fetch from "node-fetch";
import "dotenv/config";

const API_KEY = process.env.GeminiAI_API_KEY; // Using key from .env

async function listModels() {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
        headers: { "x-goog-api-key": API_KEY }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

listModels();
