class AiApi {
    constructor() {
        // This now points to our single, smart serverless function.
        this.API_URL = `/.netlify/functions/ai-proxy`;
    }

    async generateResponse(prompt, image) {
        // The request body now just contains the prompt and image data.
        const requestBody = { prompt, image };

        try {
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Proxy request failed');
            }

            // The proxy will return the AI's response directly.
            const data = await response.json();
            return data.text;

        } catch (error) {
            console.error('Error fetching from proxy:', error);
            return `An error occurred: ${error.message}`;
        }
    }