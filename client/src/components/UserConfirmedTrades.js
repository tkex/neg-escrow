import React, { useEffect, useState } from 'react';
import translateStatus from './utils/statusTranslation';

const UserAcceptedTrades = ({ token }) => {
  const [acceptedTrades, setAcceptedTrades] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/trades/confirmed', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Kein Filter der Daten notwendig, da Backend direkt akzeptierte Trades liefert
      setAcceptedTrades(data);
    })
    .catch(error => console.error('Fehler beim Abrufen der akzeptierten Trades:', error));
  }, [token]);

  return (
    <div>
      <h2>Anzeige aller akzeptierten Verhandlungen des Benutzers:</h2>
      <table>
        <thead>
          <tr>
            <th>Datum</th>
            <th>Uhrzeit der Erstellung</th>
            <th>Betreff</th>
            <th>Initiales Angebot</th>
            <th>Geeinigter Preis</th>
            <th>Gegenangebot-Historie</th>
            <th>Käufer (ID)</th>
            <th>Verkäufer (ID)</th>
            <th>Status</th>
            <th>Aktion</th>
          </tr>
        </thead>
        <tbody>
          {acceptedTrades.map(trade => (
            <tr key={trade._id}>
              <td>{new Date(trade.createdAt).toLocaleDateString()}</td>
              <td>{new Date(trade.createdAt).toLocaleTimeString()}</td>
              <td>{trade.subject}</td>
              <td>{`${trade.initOffer.toFixed(2)}€`}</td>
              <td>{trade.acceptedPrice ? `${trade.acceptedPrice.toFixed(2)}€` : 'N/A'}</td>
              <td>{trade.offerHistory.map(offer => `${offer.toFixed(2)}€`).join(' → ')}</td>
              <td>{trade.sender.username}</td>
              <td>{trade.receiver.username}</td>
              <td>{translateStatus(trade.status)}</td>
              <td>
                {/* Modal-Komponente einfügen  */}
                <button onClick={() => console.log(`Details für Trade ID: ${trade._id}`)}>Details anzeigen</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserAcceptedTrades;
