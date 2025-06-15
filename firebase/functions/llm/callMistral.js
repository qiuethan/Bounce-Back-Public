const { Mistral } = require('@mistralai/mistralai');
require('dotenv').config();

const mistral = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY,
});

const isValidBotResponse = (response) => {
  return true;
  // TODO: Implement response validation logic
};

const callMistral = async ({ chatHistory }) => {

  try {
    const response = await mistral.agents.complete({
      agentId: 'ag:f25745df:20250502:untitled-agent:f7bd5b05', 
      messages: chatHistory,
    });

    if (!isValidBotResponse(response)) {
      throw new Error("Invalid format from Mistral: Expected { choices: [{ message: { content } }] }");
    }

    return response.choices[0].message.content;
  } catch (err) {
    console.error("Mistral API error:", err.message);
    throw new Error("Failed to get a valid response from Mistral");
  }
};

module.exports = { callMistral };
