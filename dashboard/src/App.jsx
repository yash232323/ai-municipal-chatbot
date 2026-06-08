import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/tickets');
      setTickets(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.patch(`http://localhost:3000/api/tickets/${id}`, { status: newStatus });
      fetchTickets();
    } catch (error) {
      console.error("Failed to alter status:", error);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>
        🏛️ Municipal Services Admin Dashboard (AI Enhanced)
      </h1>
      <p>System Mode: <strong style={{color: 'green'}}>Automated AI Sorting Active</strong></p>

      {loading ? (
        <h3>Loading incoming database records...</h3>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2', textAlign: 'left' }}>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Ticket ID</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>AI Department Category</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Citizen Phone</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Complaint Message</th>
              <th style={{ padding: '12px', border: '1px solid #ddd' }}>Action / Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No tickets registered yet.</td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket._id}>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold', color: '#0066cc' }}>
                    {ticket.ticketId}
                  </td>
                  {/* NEW COLUMN FOR DISPLAYING THE DEPICTED CATEGORY */}
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <span style={{
                      backgroundColor: '#e6f2ff',
                      color: '#004085',
                      padding: '6px 10px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      border: '1px solid #b8daff'
                    }}>
                      🏷️ {ticket.category || 'General'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    {ticket.phoneNumber}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', italic: 'true' }}>
                    "{ticket.messageReceived}"
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <select 
                      value={ticket.status} 
                      onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                      style={{
                        padding: '6px',
                        fontWeight: 'bold',
                        borderRadius: '4px',
                        backgroundColor: ticket.status === 'Resolved' ? '#d4edda' : ticket.status === 'In Progress' ? '#fff3cd' : '#f8d7da',
                        color: ticket.status === 'Resolved' ? '#155724' : ticket.status === 'In Progress' ? '#856404' : '#721c24',
                        border: '1px solid #ccc'
                      }}
                    >
                      <option value="Open">🔴 Open</option>
                      <option value="In Progress">🟡 In Progress</option>
                      <option value="Resolved">🟢 Resolved</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;