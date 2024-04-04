import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CreateNewTradeButton = ({ onClose, onSuccess }) => {
  const [receiverId, setReceiverId] = useState('');
  const [initOffer, setInitOffer] = useState('0');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  // Zustände für Betreff und Beschreibung
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:8000/users', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Benutzerdaten konnten nicht geladen werden');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token]);

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
          subject, // Betreff
          description, // Beschreibung
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
            Empfänger:
            <select value={receiverId} onChange={(e) => setReceiverId(e.target.value)} required>
            <option value="">Bitte wählen...</option>
            {users.map(user => (
              <option key={user._id} value={user._id}>
                {user.username}
              </option>
            ))}
          </select>
          </label>
        </div>
        <div>
  <label>
    Betreff:
    <input
      type="text"
      value={subject}
      onChange={(e) => setSubject(e.target.value)}
      required
    />
  </label>
</div>
<div>
  <label>
    Beschreibung (max. 100 Zeichen):
    <textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      maxLength="100"
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
