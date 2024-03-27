import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

import CreateNewTradeButton from './CreateNewTradeButton';


const Dashboard = () => {
  const { user, logout } = useAuth();

  { /* Generelle letzten Verhandlungen (10)*/}
  const [generalTrades, setGeneralTrades] = useState([]);

  { /* Neue Verhandlung Modal*/}
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  const openTradeModal = () => setIsTradeModalOpen(true);
  const closeTradeModal = () => setIsTradeModalOpen(false);
  const handleTradeSuccess = () => {
    closeTradeModal();
    // Zusätzliche Aktionen nach dem Erfolg durchführen wie z.B. das Aktualisieren der Trade-Liste
    alert('Verhandlung erfolgreich gestartet');
  };

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

      { /* Neue Verhandlung Button */}
      <div>
      <button onClick={openTradeModal}>Neue Verhandlung starten</button>
      <CreateNewTradeButton 
        isOpen={isTradeModalOpen} 
        onClose={closeTradeModal} 
        onSuccess={handleTradeSuccess} 
      />
      </div>

      { /* Generelle letzten Verhandlungen (10)*/}
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
