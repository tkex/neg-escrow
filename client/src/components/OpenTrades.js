import React, { useEffect, useState } from 'react';

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
            <h2>Eigene offene Verhandlungen:</h2>
            <table>
                <thead>
                    <tr>
                        <th>Datum</th>
                        <th>Uhrzeit der Erstellung</th>
                        <th>Betreff</th>
                        <th>Initiales Angebot</th>
                        <th>Aktuelles Angebot</th>
                        <th>Gegenangebot-Historie</th>
                        <th>Käufer (Username)</th>
                        <th>Verkäufer (Username)</th>
                        <th>Deine Aktion</th>
                        <th>Status des Trades</th>
                        <th>Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    {openTrades.map((trade) => (
                        <tr key={trade._id}>
                            <td>{new Date(trade.createdAt).toLocaleDateString()}</td>
                            <td>{new Date(trade.createdAt).toLocaleTimeString()}</td>
                            <td>{trade.subject}</td>
                            <td>{trade.initOffer}</td>
                            <td>{trade.currentOffer}</td>
                            <td>{trade.offerHistory.join(", ")}</td>
                            <td>{trade.sender.username}</td>
                            <td>{trade.receiver.username}</td>
                            <td>{determineUserActionStatus(trade)}</td>
                            <td>{trade.status}</td>
                            <td>
                                <button onClick={() => handleAccept(trade._id)}>Akzeptieren</button>
                                <button onClick={() => handleReject(trade._id)}>Ablehnen</button>
                                <input type="number" value={trade.counterOffer} onChange={(e) => handleCounterOfferChange(trade._id, e.target.value)} />
                                <button onClick={() => handleCounterOffer(trade._id, trade.counterOffer)}>Gegenangebot</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OpenTrades;