import React, { useEffect, useState } from 'react';
import translateStatus from './utils/statusTranslations';

const GeneralLastTrades = ({ token }) => {
  const [generalTrades, setGeneralTrades] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/trades/global-lasttrades', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(response => response.json())
      .then(data => setGeneralTrades(data))
      .catch(error => console.error('Fehler generelle Verhandlungen zu holen:', error));
  }, [token]);

  return (
    <div>
      <h2>Anzeige der 10 letzten globalen Verhandlungen:</h2>
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
          {generalTrades.map(trade => (
            <tr key={trade._id}>
              <td>{new Date(trade.createdAt).toLocaleDateString()}</td>
              <td>{new Date(trade.createdAt).toLocaleTimeString()}</td>
              <td>{trade.subject}</td>
              <td>{`${trade.initOffer.toFixed(2)}€`}</td>
              <td>{trade.acceptedPrice ? `${trade.acceptedPrice.toFixed(2)}€` : 'N/A'}</td>
              <td>{trade.offerHistory.map(offer => `${offer.toFixed(2)}€`).join(' → ')}</td>
              <td>{trade.sender}</td>
              <td>{trade.receiver}</td>
              <td>{translateStatus(trade.status)}</td>
              <td>
                {/* Implementiere Modal */}
                <button onClick={() => console.log(`Details für Trade ID: ${trade._id}`)}>Details anzeigen</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GeneralLastTrades;
