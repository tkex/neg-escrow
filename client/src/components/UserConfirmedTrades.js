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
      // TODO: Eventuell in Zukunft dass nur die 100 letzten Trades angezeigt werden
      setAcceptedTrades(data);
    })
    .catch(error => console.error('Fehler beim Abrufen der akzeptierten Trades:', error));
  }, [token]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Anzeige aller akzeptierten Verhandlungen des Benutzers:</h2>
      <div className="overflow-x-auto relative shadow-lg sm:rounded-lg">
        <table className="w-full text-sm text-gray-700">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3">Trade-ID</th>
              <th scope="col" className="px-6 py-3">Datum</th>
              <th scope="col" className="px-6 py-3">Uhrzeit der Erstellung</th>
              <th scope="col" className="px-6 py-3">Betreff</th>
              <th scope="col" className="px-6 py-3">Initiales Angebot</th>
              <th scope="col" className="px-6 py-3">Geeinigter Preis</th>
              <th scope="col" className="px-6 py-3">Gegenangebot-Historie</th>
              <th scope="col" className="px-6 py-3">Käufer (ID)</th>
              <th scope="col" className="px-6 py-3">Verkäufer (ID)</th>
              <th scope="col" className="px-6 py-3">Status</th>
              <th scope="col" className="px-6 py-3">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {acceptedTrades.map(trade => (
              <tr key={trade._id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">{trade._id.length > 7 ? `${trade._id.substring(0, 10)}...` : trade._id}</td>
                <td className="px-6 py-4">{new Date(trade.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">{new Date(trade.createdAt).toLocaleTimeString()}</td>
                <td className="px-6 py-4">{trade.subject}</td>
                <td className="px-6 py-4">{`${trade.initOffer.toFixed(2)}€`}</td>
                <td className="px-6 py-4">{trade.acceptedPrice ? `${trade.acceptedPrice.toFixed(2)}€` : 'N/A'}</td>
                <td className="px-6 py-4">{trade.offerHistory.map(offer => `${offer.toFixed(2)}€`).join(' → ')}</td>
                <td className="px-6 py-4">{trade.sender.username}</td>
                <td className="px-6 py-4">{trade.receiver.username}</td>
                <td className="px-6 py-4 text-green-600 font-semibold">{translateStatus(trade.status)}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => console.log(`Details für Trade ID: ${trade._id}`)} className="font-medium text-blue-600 hover:underline">Details anzeigen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


export default UserAcceptedTrades;
