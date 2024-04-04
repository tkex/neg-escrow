import React, { useEffect, useState } from 'react';
import translateStatus from './utils/statusTranslation';
import TradeDetailsModal from './TradeDetailsModal';

const GeneralLastTrades = ({ token }) => {
  const [generalTrades, setGeneralTrades] = useState([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);

  // Modal öffnen mit den Details des ausgewählten Trades
  const handleOpenModal = (trade) => {
    setSelectedTrade(trade);
    setIsModalOpen(true);
  };

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
      <h2 className="text-lg font-semibold mb-4">Anzeige der 10 letzten globalen Verhandlungen:</h2>
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
            {generalTrades.map(trade => (
              <tr key={trade._id} className="bg-white border-b hover:bg-gray-50">
                <td className="px-6 py-4">{trade._id.length > 7 ? `${trade._id.substring(0, 10)}...` : trade._id}</td>
                <td className="px-6 py-4">{new Date(trade.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">{new Date(trade.createdAt).toLocaleTimeString()}</td>
                <td className="px-6 py-4">{trade.subject}</td>
                <td className="px-6 py-4">{`${trade.initOffer.toFixed(2)}€`}</td>
                <td className="px-6 py-4">{trade.acceptedPrice ? `${trade.acceptedPrice.toFixed(2)}€` : '-'}</td>
                <td className="px-6 py-4">{trade.offerHistory.map(offer => `${offer.toFixed(2)}€`).join(' → ')}</td>
                <td className="px-6 py-4">{trade.sender}</td>
                <td className="px-6 py-4">{trade.receiver}</td>
                <td className={`px-6 py-4 font-semibold ${trade.status === 'confirmed' ? 'text-green-600' : trade.status === 'rejected' ? 'text-red-600' : trade.status === 'pending' ? 'text-amber-300' : 'text-gray-600'}`}>
                {translateStatus(trade.status)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleOpenModal(trade)} className="font-medium text-blue-600 hover:underline">Details anzeigen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TradeDetailsModal trade={selectedTrade} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default GeneralLastTrades;
