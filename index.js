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

// 4. IN-MEMORY SESSION TRACKER FOR CONVERSATION STATE
const userSessions = {};

// 5. UPGRADED BILINGUAL AI/NLP INTENT ENGINE (Supports English, Hindi, and Hinglish)
function classifyComplaint(text) {
  const tokens = text.toLowerCase().split(/\W+/);
  
  const dictionary = {
    'Roads & Transport': ['pothole', 'road', 'street', 'सड़क', 'गड्ढा', 'रास्ता', 'sadak', 'gaddha', 'traffic'],
    'Electricity & Power': ['light', 'power', 'electricity', 'wire', 'बिजली', 'लाइट', 'तार', 'bijli', 'current'],
    'Water & Sewage': ['water', 'leak', 'pipe', 'drainage', 'sewage', 'पानी', 'पाइप', 'लीक', 'गटर', 'paani'],
    'Sanitation & Garbage': ['garbage', 'trash', 'waste', 'dump', 'clean', 'कचरा', 'गंदगी', 'कूड़ा', 'kachra', 'safai']
  };

  let bestCategory = 'General';
  let highestScore = 0;

  for (const [category, keywords] of Object.entries(dictionary)) {
    let score = 0;
    tokens.forEach(token => {
      if (keywords.includes(token)) score += 1;
    });

    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }
  return bestCategory;
}

// 6. Admin Panel API Endpoints
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

// 7. MULTI-LINGUAL STATE SWITCHBOARD WEBHOOK
app.post('/whatsapp', async (req, res) => {
  const incomingMsg = (req.body.Body || '').trim();
  const senderNumber = req.body.From;
  let replyMessage = '';

  // STATE 1: Fresh interaction -> Push the Language Prompt Menu
  if (!userSessions[senderNumber]) {
    userSessions[senderNumber] = { step: 'SELECT_LANGUAGE' };
    replyMessage = `🏛️ Welcome to Municipal Citizen Portal / नगर सेवा पोर्टल में आपका स्वागत है।\n\n🔹 Reply *1* for English\n🔹 हिंदी के लिए *2* दबाएं`;
  } 
  
  // STATE 2: Capturing language input choice
  else if (userSessions[senderNumber].step === 'SELECT_LANGUAGE') {
    if (incomingMsg === '1') {
      userSessions[senderNumber].lang = 'en';
      userSessions[senderNumber].step = 'PROVIDE_COMPLAINT';
      replyMessage = `📝 English locked in. Please type out your municipal complaint now (e.g., "The streetlights are broken").`;
    } else if (incomingMsg === '2') {
      userSessions[senderNumber].lang = 'hi';
      userSessions[senderNumber].step = 'PROVIDE_COMPLAINT';
      replyMessage = `📝 हिंदी भाषा सक्रिय है। कृपया अपनी शिकायत टाइप करें (जैसे: "सड़क पर कचरा पड़ा हुआ है")।`;
    } else {
      replyMessage = `⚠️ Invalid entry. Reply 1 or 2.\nअमान्य विकल्प। कृपया 1 या 2 दबाएं।`;
    }
  } 
  
  // STATE 3: User language is locked, now parsing raw complaint text
  else if (userSessions[senderNumber].step === 'PROVIDE_COMPLAINT') {
    const userLanguage = userSessions[senderNumber].lang;
    const detectedCategory = classifyComplaint(incomingMsg);
    const generatedTicketId = 'MUN-' + Math.floor(100000 + Math.random() * 900000);

    try {
      const newTicket = new Ticket({
        phoneNumber: senderNumber,
        messageReceived: incomingMsg,
        ticketId: generatedTicketId,
        category: detectedCategory
      });
      await newTicket.save();

      // Clear session so their next message cycles back cleanly to menu selection
      delete userSessions[senderNumber];

      // Formulate language-specific confirmation message
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
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));