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
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const currentUser = localStorage.getItem('username');

    useEffect(() => {
        if (isOpen && trade) {
            socket.emit('joinTrade', { tradeId: trade._id });

            socket.on('connect', () => {
                setConnectionStatus('connected');
            });

            socket.on('disconnect', () => {
                setConnectionStatus('disconnected');
            });

            socket.on('connect_error', () => {
                setConnectionStatus('failed');
            });

            socket.on('receiveMessage', (message) => {
                setMessages((prevMessages) => [...prevMessages, { ...message, createdAt: message.createdAt || new Date().toISOString() }]);
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
                    setMessages(data.map(msg => ({ ...msg, createdAt: msg.createdAt || new Date().toISOString() })));
                } catch (error) {
                    console.error(error);
                }
            })();
        }

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
            socket.off('receiveMessage');
        };
    }, [isOpen, trade]);

    const sendMessage = () => {
        if (newMessage.trim()) {
            const tempMessage = { message: newMessage, sender: { username: currentUser }, createdAt: new Date().toISOString() };
            setMessages((prevMessages) => [...prevMessages, tempMessage]);
            socket.emit('sendMessage', { tradeId: trade._id, message: newMessage });
            setNewMessage('');
        }
    };

    if (!isOpen || !trade) return null;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return !isNaN(date) ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}` : 'Ungültiges Datum';
    };


    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={onClose}>
            <div className="relative top-20 mx-auto p-5 border w-1/2 shadow-lg rounded-md bg-white" onClick={e => e.stopPropagation()}> {/* Anpassung der Breite */}
                <div className="mt-3 text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Trade Details</h3>
                    
                    <div className="mt-2 px-7 py-3">
                        {/* Trade Details  */}
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
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Chat</h3>
                    <div className={`connection-status my-2 ${connectionStatus === 'connecting' ? 'text-gray-400' : 'text-green-500'}`}>
                        <span>Status: {connectionStatus === 'connected' ? 'Chat ist verbunden.' : 'Chat wird hergestellt...'}</span>
                    </div>
                    <div className="chat-messages max-h-64 overflow-y-auto bg-gray-100 p-3 rounded">
                
                    {messages.map((msg, index) => (
                    <div key={index} className="message mb-2 p-2 bg-white rounded shadow">
                        <div className="message-header text-sm font-semibold">
                            <span className="text-blue-500">{msg.sender.username === currentUser ? 'Du' : msg.sender.username || 'Jemand'}:</span>
                            <span className="text-gray-400 text-xs float-right">{formatDate(msg.createdAt)}</span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                    </div>
                    ))}
                    </div>
                    <div className="mt-4 flex">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline flex-grow mr-2"/>
                        <button onClick={sendMessage} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Senden
                        </button>
                    </div>
                    <div className="items-center px-4 py-3 mt-4">
                        <button id="close-btn" className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50" style={{ width: '100%' }} onClick={onClose}>
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
