import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

import CreateNewTradeButton from './CreateNewTradeButton';



{ /* Helper-Funktionen um InitAngebot und OfferHistory zu konvertieren */}
const formatCurrency = (value) => {
  // Wert als Float behandelt wird
  const number = typeof value === 'number' ? value : parseFloat(value);
   // Konvertiert den Wert in einen String mit zwei Dezimalstellen und fügt € hinzu
  return `${number.toFixed(2)}€`;
};

const formatOfferHistory = (offerHistory) => {
  return offerHistory.map(offer => formatCurrency(offer)).join(' → ');
};




const Dashboard = () => {
  const { user, logout, token } = useAuth();

  
  { /* Generelle letzten Verhandlungen (10)*/}
  const [generalTrades, setGeneralTrades] = useState([]);


  const showTradeDetails = (tradeId) => {
    // Finde den Trade mit der gegebenen ID
    const trade = generalTrades.find(t => t._id === tradeId);

    if (trade) {
      // Code, um Details in einem Modal anzuzeigen
      // Du könntest hier den Zustand setzen, der das Modal kontrolliert und ihm die Trade-Daten übergibt
      console.log(trade); // Beispiel: Zeige die Trade-Daten in der Konsole
      // Oder öffne ein Modal mit den Trade-Details
    }
  };
  

  { /* Neue Verhandlung Modal*/}
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  const openTradeModal = () => setIsTradeModalOpen(true);
  const closeTradeModal = () => setIsTradeModalOpen(false);
  const handleTradeSuccess = () => {
    closeTradeModal();
    // Zusätzliche Aktionen ndurchführen
    // Aktualisiere die Liste der Handelsanfragen
    fetchTrades();
    //alert('Verhandlung erfolgreich angefragt.');
  };


  const fetchTrades = () => {
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
  };
  
  useEffect(() => {
    fetchTrades();
  }, []);


  return (
    <div>
      <h1>Dashboard</h1>
      <p>Benutzername: {user ? user.username : 'Unbekannt'}</p>
      <p>Benutzer-ID: {user ? user.id : 'Unbekannt'}</p>

      <div>
        <p>Anzahl offener Trades: 1</p>
        <p>Anzahl geschlossener Trades: 2</p>
        <p>Gesamtanzahl Trades: 3</p>
      </div>

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
      <h2>Anzeige der 10 letzten Verhandlungen:</h2>
      <table>
        <thead>
          <tr>
            <th>Datum</th>
            <th>Uhrzeit der Erstellung</th>
            <th>Initiales Angebot</th>
            <th>Geeinigter Preis</th>
            <th>Gegenangebot-Historie</th>
            <th>Käufer (ID)</th>
            <th>Verkäufer (ID)</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
        {generalTrades.map(trade => (
          <tr key={trade._id}>
            <td>{new Date(trade.createdAt).toLocaleDateString()}</td>
            <td>{new Date(trade.createdAt).toLocaleTimeString()}</td>
            <td>{formatCurrency(trade.initOffer)}</td>
            <td>{trade.acceptedPrice ? formatCurrency(trade.acceptedPrice) : 'N/A'}</td>
            <td>{formatOfferHistory(trade.offerHistory)}</td>
            <td>{trade.sender}</td>
            <td>{trade.receiver}</td>
            <td>{trade.status}</td>
            <td>
            {/* Schaltfläche, um Trade-Details zu zeigen */}
            <button onClick={() => showTradeDetails(trade._id)}>Details anzeigen</button>
          </td>
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
