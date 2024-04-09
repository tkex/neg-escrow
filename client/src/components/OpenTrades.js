import React, { useEffect, useState } from 'react';
import translateStatus from './utils/statusTranslation';
import TradeDetailsModal from './TradeDetailsModal';

const OpenTrades = () => {
    const [openTrades, setOpenTrades] = useState([]);

    // Benutzerdaten aus localStorage abrufen und die ID extrahieren
    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user?.id; // Zugriff auf die ID, wenn das 'user'-Objekt vorhanden ist
    console.log('Aktuelle Benutzer-ID:', userId);



    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTrade, setSelectedTrade] = useState(null);


    const openModalWithTradeDetails = (tradeDetails) => {
        setSelectedTrade(tradeDetails);
        setIsModalOpen(true);
    };
    

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
        // Wenn der Handel noch in der Anfangsphase ist
        if (trade.senderAccepted && !trade.receiverAccepted && !trade.senderHasMadeCounterOffer && !trade.receiverHasMadeCounterOffer) {
            return 'Initialangebot gemacht';
        }
    
        // **
        // Wenn der Empfänger das Angebot abgelehnt hat (eigentlich überflüssig da "offene" Verhandlungen )
        if (!trade.receiverAccepted && trade.status === 'rejected') {
            return 'Angebot abgelehnt';
        }
    
        // Wenn der Empfänger das Angebot akzeptiert hat (eigentlich überflüssig da "offene" Verhandlungen )
        if (trade.receiverAccepted && trade.status === 'confirmed') {
            return 'Angebot akzeptiert';
        }
        // **
    
        // Wenn der Empfänger ein Gegenangebot gemacht hat
        if (!trade.senderAccepted && trade.receiverAccepted && !trade.senderHasMadeCounterOffer && trade.receiverHasMadeCounterOffer) {
            return 'Gegenangebot erhalten';
        }
    
        // Wenn der Sender ein Gegenangebot gemacht hat
        if (trade.senderAccepted && !trade.receiverAccepted && trade.senderHasMadeCounterOffer && trade.receiverHasMadeCounterOffer) {
            return 'Gegenangebot gemacht';
        }
    
        // Für alle anderen Fälle bspw. wenn noch keine Aktion durchgeführt wurde
        return 'Keine Aktion';
    };
    
    
    // Hilfsfunktion um zu bestimmen, ob der aktuell angemeldete Benutzer der Sender des Handels ist
    const isCurrentUserTheSender = (trade) => {
        // Zugriff auf die ID innerhalb des sender-Objekts
        const isSender = trade.sender._id === userId;
        console.log(`Ist der aktuelle Benutzer der Sender für Handel ${trade._id}?`, isSender, `Sender-ID: ${trade.sender._id}, User-ID: ${userId}`);
        return isSender;
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
                  <th scope="col" className="px-6 py-3">Letzte Aktion</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Verfügbare Aktionen</th>
                  <th scope="col" className="px-6 py-3">Modal</th>
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
                    {isCurrentUserTheSender(trade) ? (
                        (!trade.senderAccepted && trade.receiverAccepted && !trade.senderHasMadeCounterOffer && trade.receiverHasMadeCounterOffer) ? (
                        <>
                            <button className="font-medium text-green-600 hover:underline mr-2" onClick={() => handleAccept(trade._id)}>Akzeptieren</button>
                            <button className="font-medium text-red-600 hover:underline mr-2" onClick={() => handleReject(trade._id)}>Ablehnen</button>
                            <div className="flex items-center mr-2">
                            <span className="absolute ml-3 text-gray-700">€</span>
                            <input 
                                type="text" 
                                className="shadow appearance-none border rounded w-32 py-2 pl-8 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                value={trade.counterOffer || ''} 
                                onChange={(e) => handleCounterOfferChange(trade._id, e.target.value.replace(/[^0-9,.]/g, ''))}
                                onBlur={(e) => handleCounterOfferChange(trade._id, parseFloat(e.target.value.replace(',', '.')).toFixed(2))}
                                placeholder="0,00"
                            />
                            </div>
                            <button className="font-medium text-blue-600 hover:underline" onClick={() => handleCounterOffer(trade._id, trade.counterOffer)}>Gegenangebot</button>
                        </>
                        ) : (
                        <span>Keine Aktion momentan verfügbar</span>
                        )
                    ) : (
                        (trade.senderAccepted && !trade.receiverAccepted) ? (
                        <>
                            {(!trade.senderHasMadeCounterOffer && !trade.receiverHasMadeCounterOffer) ? (
                            <>
                                <button className="font-medium text-green-600 hover:underline mr-2" onClick={() => handleAccept(trade._id)}>Akzeptieren</button>
                                <button className="font-medium text-red-600 hover:underline mr-2" onClick={() => handleReject(trade._id)}>Ablehnen</button>
                                <div className="flex items-center mr-2">
                                <span className="absolute ml-3 text-gray-700">€</span>
                                <input 
                                    type="text" 
                                    className="shadow appearance-none border rounded w-32 py-2 pl-8 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                    value={trade.counterOffer || ''} 
                                    onChange={(e) => handleCounterOfferChange(trade._id, e.target.value.replace(/[^0-9,.]/g, ''))}
                                    onBlur={(e) => handleCounterOfferChange(trade._id, parseFloat(e.target.value.replace(',', '.')).toFixed(2))}
                                    placeholder="0,00"
                                />
                                </div>
                                <button className="font-medium text-blue-600 hover:underline" onClick={() => handleCounterOffer(trade._id, trade.counterOffer)}>Gegenangebot</button>
                            </>
                            ) : (
                            trade.senderHasMadeCounterOffer && trade.receiverHasMadeCounterOffer && (
                                <>
                                <button className="font-medium text-green-600 hover:underline mr-2" onClick={() => handleAccept(trade._id)}>Akzeptieren</button>
                                <button className="font-medium text-red-600 hover:underline mr-2" onClick={() => handleReject(trade._id)}>Ablehnen</button>
                                </>
                            )
                            )}
                        </>
                        ) : (
                        <span>Keine Aktion momentan verfügbar</span>
                        )
                    )}
                    </td>


                    <td><button onClick={() => openModalWithTradeDetails(trade)} className="font-medium text-blue-600 hover:underline">Details anzeigen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
                    <TradeDetailsModal 
                trade={selectedTrade} 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
      );
      
};

export default OpenTrades;