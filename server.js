const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(bodyParser.json());

app.post('/chatgpt', async (req, res) => {
  const prompt = req.body.prompt;

  // Use Azure OpenAI endpoint and replace with your actual key and endpoint
  const endpoint = "https://opnai-wus-01.openai.azure.com/";
  const apiKey = process.env.AZURE_OPENAI_API_KEY; // Make sure to update your .env file

  try {
    const response = await fetch(`${endpoint}openai/deployments/your-deployment-id/completions?api-version=2023-05-15`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.7
      }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error processing request.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
