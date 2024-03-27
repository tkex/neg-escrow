import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CreateNewTradeButton = ({ onClose, onSuccess }) => {
  const [receiverId, setReceiverId] = useState('');
  const [initOffer, setInitOffer] = useState('');
  const { token } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Sie sind nicht eingeloggt.");
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/trade/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver: receiverId,
          tradeType: 'Angebot',
          initOffer: parseFloat(initOffer),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        alert(data.message);
      } else {
        throw new Error(data.message || 'Ein Fehler ist aufgetreten');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Empfänger-ID:
            <input
              type="text"
              value={receiverId}
              onChange={(e) => setReceiverId(e.target.value)}
              required
            />
          </label>
        </div>
        <div>
          <label>
            Initialangebot:
            <input
              type="number"
              value={initOffer}
              onChange={(e) => setInitOffer(e.target.value)}
              required
            />
          </label>
        </div>

        <button type="submit">Angebot senden</button>
        <button type="button" onClick={onClose}>Abbrechen</button>
      </form>
    </div>
  );
};

export default CreateNewTradeButton;
