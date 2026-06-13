// 1. Force Node to bypass local network DNS blocks
const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const twilio = require('twilio');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// 2. Connect to MongoDB Cloud
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Cloud Connected Successfully!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// 3. Database Schema
const TicketSchema = new mongoose.Schema({
  phoneNumber: String,
  messageReceived: String,
  ticketId: String,
  category: { type: String, default: 'General' },
  status: { type: String, default: 'Open' },
  createdAt: { type: Date, default: Date.now }
});

const Ticket = mongoose.model('Ticket', TicketSchema);

const userSessions = {};

// 4. NEW: DEEP LEARNING SEMANTIC AI ENGINE (Zero-Shot Classification)
// 🧠 UPGRADED: GEMINI 1.5 FLASH SEMANTIC AI ENGINE
async function classifyComplaintWithAI(text) {
  try {
    console.log(`🤖 Processing text through Gemini 1.5 Flash LLM...`);
    
    // Crafting a strict system prompt so Gemini only returns our categories
    const systemPrompt = `You are an automated municipal complaint classification AI. 
Analyze the following citizen complaint and classify it into EXACTLY ONE of these categories:
- Roads & Transport
- Electricity & Power
- Water & Sewage
- Sanitation & Garbage

Rules:
1. Respond with ONLY the exact category name from the list above.
2. Do NOT write any explanations, greetings, introduction, or punctuation.
3. If the complaint does not fit any of the four specific categories, respond with exactly: General

Citizen Complaint: "${text}"`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt }]
          }]
        })
      }
    );

    const data = await response.json();
    
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      const aiReply = data.candidates[0].content.parts[0].text.trim();
      console.log(`🎯 Gemini Contextual Classification Output: [${aiReply}]`);
      
      // Clean verification loop
      const validCategories = ["Roads & Transport", "Electricity & Power", "Water & Sewage", "Sanitation & Garbage"];
      for (let cat of validCategories) {
        if (aiReply.toLowerCase().includes(cat.toLowerCase())) {
          return cat;
        }
      }
    }
    
    return "General";
  } catch (error) {
    console.error("❌ Gemini LLM API connection failed, using fallback:", error);
    return "General";
  }
}

// 5. Admin Panel API Endpoints
app.get('/api/tickets', async (req, res) => {
  try {
    const allTickets = await Ticket.find().sort({ createdAt: -1 });
    res.json(allTickets);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedTicket = await Ticket.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (status === 'Resolved') {
      await twilioClient.messages.create({
        from: process.env.TWILIO_NUMBER,
        to: updatedTicket.phoneNumber,
        body: `🎉 Update: Your Ticket [${updatedTicket.ticketId}] has been marked as RESOLVED by our municipal field team. / आपकी शिकायत [${updatedTicket.ticketId}] का निवारण कर दिया गया है।`
      });
    }
    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 6. MULTI-LINGUAL STATE SWITCHBOARD WEBHOOK
app.post('/whatsapp', async (req, res) => {
  const incomingMsg = (req.body.Body || '').trim();
  const senderNumber = req.body.From;
  let replyMessage = '';

  if (!userSessions[senderNumber]) {
    userSessions[senderNumber] = { step: 'SELECT_LANGUAGE' };
    replyMessage = `🏛️ Welcome to Municipal Citizen Portal / नगर सेवा पोर्टल में आपका स्वागत है।\n\n🔹 Reply *1* for English\n🔹 हिंदी के लिए *2* दबाएं`;
  } 
  else if (userSessions[senderNumber].step === 'SELECT_LANGUAGE') {
    if (incomingMsg === '1') {
      userSessions[senderNumber].lang = 'en';
      userSessions[senderNumber].step = 'PROVIDE_COMPLAINT';
      replyMessage = `📝 English locked in. Please type out your municipal complaint now.`;
    } else if (incomingMsg === '2') {
      userSessions[senderNumber].lang = 'hi';
      userSessions[senderNumber].step = 'PROVIDE_COMPLAINT';
      replyMessage = `📝 हिंदी भाषा सक्रिय है। कृपया अपनी शिकायत टाइप करें।`;
    } else {
      replyMessage = `⚠️ Invalid entry. Reply 1 or 2.\nअमान्य विकल्प। कृपया 1 या 2 दबाएं।`;
    }
  } 
  else if (userSessions[senderNumber].step === 'PROVIDE_COMPLAINT') {
    const userLanguage = userSessions[senderNumber].lang;
    
    // 🧠 CRUCIAL CHANGE: Calling our modern async Semantic AI model here
    const detectedCategory = await classifyComplaintWithAI(incomingMsg);
    console.log(`🎯 AI Contextual Classification Output: [${detectedCategory}]`);
    
    const generatedTicketId = 'MUN-' + Math.floor(100000 + Math.random() * 900000);

    try {
      const newTicket = new Ticket({
        phoneNumber: senderNumber,
        messageReceived: incomingMsg,
        ticketId: generatedTicketId,
        category: detectedCategory
      });
      await newTicket.save();

      delete userSessions[senderNumber];

      if (userLanguage === 'hi') {
        replyMessage = `✅ धन्यवाद! आपकी [${detectedCategory}] संबंधी शिकायत दर्ज कर ली गई है।\n\n🎫 आपका टिकट नंबर है: *${generatedTicketId}*`;
      } else {
        replyMessage = `✅ Thank you! Your complaint matching [${detectedCategory}] has been logged.\n\n🎫 Your unique Ticket ID is: *${generatedTicketId}*`;
      }

    } catch (error) {
      console.error('❌ Error recording ticket:', error);
      replyMessage = 'System error. Please retry.';
    }
  }

  res.set('Content-Type', 'text/xml');
  res.send(`<Response><Message>${replyMessage}</Message></Response>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 AI Server running on port ${PORT}`));
// Serverless environments ke liye app ko export karna zaroori hai
module.exports = app;