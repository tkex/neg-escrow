import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const CreateNewTradeButton = ({ onClose, onSuccess }) => {
  const [receiverId, setReceiverId] = useState('');
  const [initOffer, setInitOffer] = useState('0');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token, user } = useAuth();

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
         // Filtere den aktuell eingeloggten Benutzer in der Auswahlliste
        const filteredUsers = data.filter(u => u._id !== user.id);
        setUsers(filteredUsers);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token, user.id]);

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
    <div className="modal bg-white shadow-xl rounded-lg p-4 mb-4 max-w-lg mx-auto">

      <form onSubmit={handleSubmit}>
        {isLoading ? (
          <div>Lade Benutzer...</div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Empfänger:
                <select value={receiverId} onChange={(e) => setReceiverId(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ml-2">
                  <option value="">Bitte wählen...</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Betreff:
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
              </label>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Beschreibung (max. 100 Zeichen):
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength="100" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"/>
              </label>
            </div>
            { /* 
              <div className="mb-6 relative">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Initialangebot:
                  <div className="flex items-center">
                    <input type="number" step="0.01" value={initOffer} onChange={(e) => setInitOffer(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline pr-8"/>
                    <span className="absolute right-3 text-gray-700">€</span>
                  </div>
                </label>
              </div>
            */}
            <div className="mb-6 relative">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Initialangebot:
              </label>
              <div className="flex items-center">
                <span className="absolute left-0 ml-3 text-gray-700">€</span>
                <input 
                type="text" 
                value={initOffer}
                onChange={(e) => setInitOffer(e.target.value.replace(/[^0-9,.]/g, ''))}
                onBlur={() => setInitOffer(parseFloat(initOffer.replace(',', '.')).toFixed(2))}
                required 
                className="shadow appearance-none border rounded w-full py-2 pl-8 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="0,00"
                />
              </div>
          </div>
            <div className="flex items-center justify-between">
              <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Angebot senden
              </button>
              <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Abbrechen</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default CreateNewTradeButton;

