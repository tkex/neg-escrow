import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';



const Dashboard = () => {
  const [generalTrades, setGeneralTrades] = useState([]);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetch('http://localhost:8000/trades/gen_lasttrades', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })
    .then(response => response.json())
    .then(data => {
      setGeneralTrades(data);
    })
    .catch(error => console.error('Fehler generelle Verhandlungen zu holen:', error));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Benutzername: {user ? user.username : 'Unbekannt'}</p>
      <p>Benutzer-ID: {user ? user.id : 'Unbekannt'}</p>
      <button onClick={logout}>Logout</button>

      <button onClick={logout}>Neue Verhandlung starten</button>

      <table>
        <thead>
          <tr>
            <th>Zeitpunkt</th>
            <th>Initiales Angebot</th>
            <th>Geeinigter Preis</th>
            <th>Gegenangebot-Historie</th>
            <th>Käufer (ID)</th>
            <th>Verkäufer (ID)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {generalTrades.map(trade => (
            <tr key={trade._id}>
              <td>{new Date(trade.createdAt).toLocaleDateString()}</td>
              <td>{trade.initOffer}</td>
              <td>{trade.acceptedPrice}</td>
              <td>{trade.offerHistory.join(' - ')}</td>
              <td>{trade.sender}</td>
              <td>{trade.receiver}</td>
              <td>{trade.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
