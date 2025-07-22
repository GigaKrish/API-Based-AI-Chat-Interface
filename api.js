class GeminiAPI {
    constructor(apiKey) {
        this.API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    }

    async generateResponse(prompt, image) {
        const parts = [{ text: prompt }];
        if (image && image.data) {
            parts.push({
                inline_data: {
                    mime_type: image.mime_type,
                    data: image.data,
                },
            });
        }

        const requestBody = {
            contents: [{ parts: parts }],
        };

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error Response:", errorData);
                throw new Error(`API request failed with status ${response.status}: ${errorData.error.message}`);
            }

            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text.trim();
            } else {
                return "I'm sorry, I couldn't generate a response. Please try again.";
            }
        } catch (error) {
            console.error('Error generating response:', error);
            return `An error occurred: ${error.message}. Please check the console for more details.`;
        }
    }
}