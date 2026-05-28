import fetch from "node-fetch";

const API_KEY = "AIzaSyDWQsq1snfwxl7RaiuVP6Hr0tvBz0wq68s"; // your key

async function listModels() {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
        headers: { "x-goog-api-key": API_KEY }
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
}

listModels();
