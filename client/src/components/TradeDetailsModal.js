import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import translateStatus from './utils/statusTranslation';


const socket = io('http://localhost:8000', {
    query: {
        token: localStorage.getItem('token'),
    },
});

const TradeDetailsModal = ({ trade, isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        if (isOpen && trade) {
            socket.emit('joinTrade', { tradeId: trade._id });

            socket.on('receiveMessage', (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
            });

            // Abrufen vorhandener Nachrichten für den Trade
            (async () => {
                try {
                    const response = await fetch(`http://localhost:8000/trade/${trade._id}/chat`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        },
                    });
                    if (!response.ok) {
                        throw new Error('Fehler beim Laden der Chat-Nachrichten');
                    }
                    const data = await response.json();
                    setMessages(data);
                } catch (error) {
                    console.error(error);
                }
            })();
        }

        // Bereinigen
        return () => {
            socket.off('receiveMessage');
        };
    }, [isOpen, trade]);

    const sendMessage = () => {
        if (newMessage.trim()) {
            socket.emit('sendMessage', { tradeId: trade._id, message: newMessage });
            setNewMessage('');
        }
    };

    if (!isOpen || !trade) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={onClose}>
            <div className="relative top-20 mx-auto p-5 border w-3/4 shadow-lg rounded-md bg-white" onClick={e => e.stopPropagation()}>
                <div className="mt-3 text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Trade Details</h3>
                    <div className="mt-2 px-7 py-3">
                    <DetailItem label="Trade-ID" value={trade._id} />
                    <DetailItem label="Status" value={translateStatus(trade.status)} status={trade.status} />
                    <DetailItem label="Käufer" value={trade.sender?.username || trade.sender} />
                    <DetailItem label="Verkäufer" value={trade.receiver?.username || trade.receiver} />
                    <hr className="my-8 border-t" />
                    <DetailItem label="Betreff" value={trade.subject} />
                    <DetailItem label="Beschreibung" value={trade.description} />
                    <DetailItem label="Datum" value={new Date(trade.createdAt).toLocaleDateString()} />
                    <DetailItem label="Uhrzeit" value={new Date(trade.createdAt).toLocaleTimeString()} />
                    <hr className="my-8 border-t" />
                    <DetailItem label="Initiales Angebot" value={`${trade.initOffer.toFixed(2)}€`} />
                    <DetailItem label="Geeinigter Preis" value={trade.acceptedPrice ? `${trade.acceptedPrice.toFixed(2)}€` : '-'} />
                    <DetailItem label="Gegenangebot-Historie" value={trade.offerHistory.map(offer => `${offer.toFixed(2)}€`).join(' → ')} />
                    </div>
                    <hr className="my-4 border-t" />
                    <div className="chat-messages max-h-64 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <div key={index} className="message mb-2">
                                <div className="message-header">
                                    <strong>{msg.sender.username || 'Jemand'}:</strong>
                                </div>
                                <p>{msg.message}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"/>
                        <button onClick={sendMessage} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Senden
                        </button>
                    </div>
                    <div className="items-center px-42 py-3 mt-4">
                        <button id="ok-btn" className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" onClick={onClose}>
                            Schließen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({ label, value, status }) => (
  <div className="flex justify-between items-center">
    <span className="font-semibold">{label}:</span>
    <span className={`${status === 'confirmed' ? 'text-green-600' : status === 'rejected' ? 'text-red-600' : status === 'pending' ? 'text-yellow-500' : 'text-gray-500'}`}>
      {value}
    </span>
  </div>
);

export default TradeDetailsModal;
