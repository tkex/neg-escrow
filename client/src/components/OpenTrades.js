import React, { useEffect, useState } from 'react';
import translateStatus from './utils/statusTranslation';

const OpenTrades = () => {
    const [openTrades, setOpenTrades] = useState([]);

    const userId = localStorage.getItem('userId');

    useEffect(() => {
        fetchOpenTrades();
    }, []);

    const fetchOpenTrades = async () => {
        try {
            const response = await fetch('http://localhost:8000/user/open-trades', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            setOpenTrades(data.map(trade => ({ ...trade, counterOffer: '' }))); // Initiale Zustandserweiterung für das Gegenangebot
        } catch (error) {
            console.error("Fehler beim Abrufen offener Verhandlungen:", error);
        }
    };

    const handleAccept = async (tradeId) => {
        await acceptTrade(tradeId);
    };

    const handleReject = async (tradeId) => {
        await rejectTrade(tradeId);
    };

    const handleCounterOffer = async (tradeId, counterOffer) => {
        await makeCounterOffer(tradeId, counterOffer);
    };

    const handleCounterOfferChange = (tradeId, value) => {
        setOpenTrades(currentTrades => currentTrades.map(trade => trade._id === tradeId ? { ...trade, counterOffer: value } : trade));
    };
    const acceptTrade = async (tradeId) => {
        try {
            const response = await fetch('http://localhost:8000/trade/accept', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tradeId })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            fetchOpenTrades();
        } catch (error) {
            console.error("Fehler beim Akzeptieren des Handels:", error);
        }
    };

    const rejectTrade = async (tradeId) => {
        try {
            const response = await fetch('http://localhost:8000/trade/reject', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tradeId })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            fetchOpenTrades();
        } catch (error) {
            console.error("Fehler beim Ablehnen des Handels:", error);
        }
    };

    const makeCounterOffer = async (tradeId, counterOffer) => {
        try {
            const response = await fetch('http://localhost:8000/trade/counteroffer', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tradeId, counterOffer })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            fetchOpenTrades();
        } catch (error) {
            console.error("Fehler beim Unterbreiten eines Gegenangebots:", error);
        }
    };



    const determineUserActionStatus = (trade) => {
        // Bestätigt
        if (trade.status === 'confirmed') return 'Bestätigt';
        // Abgelehnt
        if (trade.status === 'rejected') return 'Abgelehnt';
        // Akzeptiert von beiden
        if (trade.senderConfirmed && trade.receiverConfirmed) return 'Akzeptiert von beiden';
        // Spezifische Fälle, abhängig von der Rolle des Benutzers und der Aktion
        if (trade.sender.toString() === userId) {
            if (trade.senderConfirmed) return 'Von dir gesendet und bestätigt';
            if (trade.receiverHasMadeCounterOffer) return 'Gegenangebot erhalten';
            return 'Anfrage gesendet'; // Standardstatus für den Sender, wenn noch keine weitere Aktion erfolgt ist
        } else if (trade.receiver.toString() === userId) {
            if (trade.receiverConfirmed) return 'Von dir akzeptiert';
            if (trade.senderHasMadeCounterOffer) return 'Gegenangebot gemacht';
            return 'Anfrage erhalten'; // Standardstatus für den Empfänger, wenn noch keine Aktion erfolgt ist
        }
        return 'Noch keine Aktion'; // Fallback, sollte theoretisch nicht erreicht werden
    };
    

    return (
        <div>
          <h2 className="text-lg font-semibold mb-4">Eigene offene Verhandlungen:</h2>
          <div className="overflow-x-auto relative shadow-lg sm:rounded-lg">
            <table className="w-full text-sm text-gray-700">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3">Trade-ID</th>
                  <th scope="col" className="px-6 py-3">Datum</th>
                  <th scope="col" className="px-6 py-3">Uhrzeit der Erstellung</th>
                  <th scope="col" className="px-6 py-3">Betreff</th>
                  <th scope="col" className="px-6 py-3">Initiales Angebot</th>
                  <th scope="col" className="px-6 py-3">Aktuelles Angebot</th>
                  <th scope="col" className="px-6 py-3">Gegenangebot-Historie</th>
                  <th scope="col" className="px-6 py-3">Käufer (Username)</th>
                  <th scope="col" className="px-6 py-3">Verkäufer (Username)</th>
                  <th scope="col" className="px-6 py-3">Deine Aktion</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {openTrades.map((trade) => (
                  <tr key={trade._id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">{trade._id.length > 7 ? `${trade._id.substring(0, 10)}...` : trade._id}</td>
                    <td className="px-6 py-4">{new Date(trade.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{new Date(trade.createdAt).toLocaleTimeString()}</td>
                    <td className="px-6 py-4">{trade.subject.length > 10 ? `${trade.subject.substring(0, 20)}...` : trade.subject}</td>
                    <td className="px-6 py-4">{`${trade.initOffer.toFixed(2)}€`}</td>
                    <td className="px-6 py-4">{`${trade.currentOffer.toFixed(2)}€`}</td>
                    <td className="px-6 py-4">{trade.offerHistory.map(offer => `${offer.toFixed(2)}€`).join(' → ')}</td>
                    <td className="px-6 py-4">{trade.sender.username}</td>
                    <td className="px-6 py-4">{trade.receiver.username}</td>
                    <td className="px-6 py-4">{determineUserActionStatus(trade)}</td>
                    <td className={`px-6 py-4 font-semibold ${trade.status === 'confirmed' ? 'text-green-600' : trade.status === 'rejected' ? 'text-red-600' : trade.status === 'pending' ? 'text-amber-300' : 'text-gray-600'}`}>
                    {translateStatus(trade.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="font-medium text-blue-600 hover:underline mr-2" onClick={() => handleAccept(trade._id)}>Akzeptieren</button>
                      <button className="font-medium text-red-600 hover:underline mr-2" onClick={() => handleReject(trade._id)}>Ablehnen</button>
                      <input className="text-right shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" type="number" value={trade.counterOffer} onChange={(e) => handleCounterOfferChange(trade._id, e.target.value)} />
                      <button className="font-medium text-green-600 hover:underline" onClick={() => handleCounterOffer(trade._id, trade.counterOffer)}>Gegenangebot</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      
};

export default OpenTrades;