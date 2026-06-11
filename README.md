# 🏛️ AI-Powered Multi-Lingual Municipal Chatbot & Admin Portal

An event-driven, full-stack MERN application designed to bridge the communication gap between citizens and municipal authorities. The system allows citizens to seamlessly log complaints over WhatsApp in multiple languages, automatically categorizes issues using an in-memory NLP intent engine, and streams data live to an interactive administrative control panel.

---

## 🚀 Key Features

* **Bilingual State-Machine Engine:** Handles dynamic conversation flows over WhatsApp, allowing users to toggle seamlessly between English and Hindi (`Devanagari` & `Hinglish`).
* **Automated AI Text Classification:** Utilizes a backend NLP tokenization and keyword-scoring dictionary to parse unstructured text inputs and instantly tag them into core departments (*Roads*, *Electricity*, *Water*, *Sanitation*).
* **Real-Time Interactive Dashboard:** Built with React (Vite) to continuously fetch incoming records from a cloud database without causing browser overhead.
* **Bi-Directional Communication:** Automatically shoots a resolution alert back to the citizen's personal phone via WhatsApp the split-second an administrator marks a ticket as `Resolved`.
* **CORS Security Compliance:** Fully managed cross-origin port-to-port pipeline protection for safe data transitions.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite), Axios, CSS3
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas (Cloud Clustered Database)
* **APIs & Protocols:** Twilio WhatsApp Sandbox API, Serveo SSH Tunneling

---

## ⚙️ Local Setup & Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+) and [Git](https://git-scm.com/) installed on your machine.

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/ai-municipal-chatbot.git](https://github.com/your-username/ai-municipal-chatbot.git)
cd ai-municipal-chatbot
