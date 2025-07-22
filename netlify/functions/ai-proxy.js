const fetch = require('node-fetch');

// --- Handler for Google Gemini ---
async function handleGemini(prompt, image) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    const parts = [{ text: prompt || "" }];
    if (image && image.data) {
        parts.push({ inline_data: { mime_type: image.mime_type, data: image.data } });
    }
    const requestBody = { contents: [{ parts }] };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message);
    }
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

// --- Handler for OpenAI ChatGPT ---
async function handleChatGPT(prompt) {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const API_URL = 'https://api.openai.com/v1/chat/completions';

    const requestBody = {
        model: "gpt-4", // Or "gpt-3.5-turbo"
        messages: [{ role: "user", content: prompt }]
    };

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message);
    }
    const data = await response.json();
    return data.choices[0].message.content;
}

// --- Main Serverless Function Handler ---
exports.handler = async function (event) {
    try {
        const { prompt, image } = JSON.parse(event.body);
        let responseText;

        // Check which API key is available and call the corresponding handler.
        if (process.env.GEMINI_API_KEY) {
            responseText = await handleGemini(prompt, image);
        } else if (process.env.OPENAI_API_KEY) {
            // Note: Basic ChatGPT handler doesn't use the image parameter here.
            responseText = await handleChatGPT(prompt);
        } else {
            throw new Error("No AI provider API key found in environment variables.");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ text: responseText }),
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};