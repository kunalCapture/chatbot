import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import 'dotenv/config'
import fetch from 'node-fetch';
import { generatePrompt, generateSummaryPrompt } from './prompt.js'; // Import updated prompt logic
import fs from 'fs'; 

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

let conversationHistory = {};

// Function to prompt the AI to summarize what it knows about the user
async function getUserSummary(sessionId) {
  // Add a system message asking the AI to summarize what it knows so far

  if(!conversationHistory[sessionId]){
    return null;
  }

  const summaryPrompt = generateSummaryPrompt();

  conversationHistory[sessionId].push({
    role: 'system',
    content: summaryPrompt
  });

  // Make a request to OpenAI to get the summary
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: conversationHistory[sessionId],
    }),
  });

  const data = await response.json();

  if (response.ok) {
    return data.choices[0].message.content;  // Return the AI's summary
  } else {
    console.error(`Error with OpenAI API:`, data);
    return 'Error generating user summary.';
  }
}

// Route to handle the chatbot request
app.post('/get-response', async (req, res) => {
  const { message, sessionId, website } = req.body;

  // Initialize session history if it doesn't exist
  if (!conversationHistory[sessionId]) {
    // Generate the main prompt dynamically
    const promptWithWebsite = await generatePrompt(website);
    console.log(promptWithWebsite)
    // console.log(`Session ${sessionId} - Prompt being used:\n${promptWithWebsite}\n`);
    conversationHistory[sessionId] = [{ role: 'system', content: promptWithWebsite }];
  }

  // Add user message to the conversation history
  conversationHistory[sessionId].push({ role: 'user', content: message });

  // Use fetch to make a request to OpenAI API for the actual response
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: conversationHistory[sessionId],
      }),
    });

    const data = await response.json();

    if (response.ok) {
      const botResponse = data.choices[0].message.content; // Extract the bot's response
      conversationHistory[sessionId].push({ role: 'system', content: botResponse });
      // console.log(`Session ${sessionId} - Bot response: ${botResponse}`);
      res.json({ response: botResponse });
    } else {
      console.error(`Session ${sessionId} - Error with OpenAI API:`, data);
      res.status(500).json({ response: 'Error with the AI service.' });
    }
  } catch (error) {
    console.error(`Session ${sessionId} - Error with OpenAI API:`, error);
    res.status(500).json({ response: 'Error with the AI service.' });
  }
});

app.post('/send-user-info', async (req, res) => {
  const sessionId = req.body.sessionId;

  // Get user summary and convert it to JSON
  const userSummary = await getUserSummary(sessionId);
  if(!userSummary){
    return res.json({ message: 'Session information not found. Nothing to do.' });
  }
  const userInfo = JSON.parse(userSummary);

  // Write session information to {sessionId}.json
  fs.writeFile(`results/${sessionId}.json`, JSON.stringify(conversationHistory[sessionId], null, 2), (err) => {
    if (err) {
      console.error(`Error writing session file for sessionId ${sessionId}:`, err);
      return res.status(500).json({ message: 'Error saving session data.' });
    }
    console.log(`Session data saved to ${sessionId}.json`);

    // Write user information to {sessionId}_result.json
    fs.writeFile(`results/${sessionId}_result.json`, JSON.stringify(userInfo, null, 2), (err) => {
      if (err) {
        console.error(`Error writing user info file for sessionId ${sessionId}:`, err);
        return res.status(500).json({ message: 'Error saving user information.' });
      }
      console.log(`User info saved to ${sessionId}_result.json`);

      // Now delete the session information from the conversation history
      delete conversationHistory[sessionId];

      return res.json({...userInfo, sessionId});
    });
  });
});



// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
