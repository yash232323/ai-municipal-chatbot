import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from backend
  const fetchTickets = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/tickets');
      setTickets(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching tickets:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 5000); // Live poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(`http://localhost:3000/api/tickets/${id}`, { status: newStatus });
      fetchTickets(); // Refresh state
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  // Live Metrics Calculation
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'Open').length;
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;

  // Category Color Map helper
  const getCategoryClass = (cat) => {
    switch(cat) {
      case 'Roads & Transport': return 'badge-roads';
      case 'Electricity & Power': return 'badge-power';
      case 'Water & Sewage': return 'badge-water';
      case 'Sanitation & Garbage': return 'badge-garbage';
      default: return 'badge-general';
    }
  };

  return (
    <div className="dashboard-container">
      {/* HEADER SECTION */}
      <header className="main-header">
        <div className="logo-section">
          <span className="icon-pulse">🏛️</span>
          <h1>MUNICIPAL CONTROL CENTER</h1>
          <p>System Mode: <span className="status-glow">Gemini 1.5 Flash Active</span></p>
        </div>
      </header>

      {/* METRICS CARDS */}
      <div className="metrics-grid">
        <div className="card metric-card total">
          <h3>Total Grievances</h3>
          <div className="metric-value">{totalTickets}</div>
        </div>
        <div className="card metric-card open">
          <h3>Active Incidents</h3>
          <div className="metric-value">{openTickets}</div>
          <span className="pulse-dot"></span>
        </div>
        <div className="card metric-card resolved">
          <h3>Resolved Pipeline</h3>
          <div className="metric-value">{resolvedTickets}</div>
        </div>
      </div>

      {/* RECENT STREAM DATA */}
      <main className="content-section">
        <div className="card table-card">
          <div className="table-header-title">
            <h2>Live Inbound Complaint Logs</h2>
            <span className="live-tag">● LIVE STREAMING</span>
          </div>
          
          {loading ? (
            <div className="loader">Syncing secure pipelines...</div>
          ) : (
            <div className="table-responsive">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Citizen Identity</th>
                    <th>AI Department Routing</th>
                    <th>Extracted Raw Complaint Text</th>
                    <th>Operation Status / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket._id} className={ticket.status === 'Resolved' ? 'row-resolved' : ''}>
                      <td className="ticket-id">{ticket.ticketId}</td>
                      <td className="phone-cell">{ticket.phoneNumber.replace('whatsapp:', '')}</td>
                      <td>
                        <span className={`ai-badge ${getCategoryClass(ticket.category)}`}>
                          ✨ {ticket.category}
                        </span>
                      </td>
                      <td className="message-cell">
                        <div className="msg-bubble">"{ticket.messageReceived}"</div>
                      </td>
                      <td>
                        <select 
                          className={`status-select ${ticket.status.toLowerCase()}`}
                          value={ticket.status} 
                          onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                        >
                          <option value="Open">🔴 Open / Unassigned</option>
                          <option value="In Progress">🟡 In Progress</option>
                          <option value="Resolved">🟢 Marked Resolved</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;