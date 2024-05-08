import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CreateNewTradeButton from './CreateNewTradeButton';

import OpenTrades from './OpenTrades';
import GlobalLastTrades from './GlobalLastTrades';
import UserLastDeniedTrades from './UserLastDeniedTrades';
import UserConfirmedTrades from './UserConfirmedTrades';
import UserLastClosedTrades from './UserLastClosedTrades';



// Hook für das Abrufen der Handelszahlen
const useTradeCount = (url, token) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    .then(response => response.json())
    .then(data => setCount(data.count))
    .catch(error => console.error('Fehler beim Abrufen der Trade-Anzahl:', error));
  }, [url, token]);

  return count;
};

const Dashboard = () => {
  const { user, logout, token } = useAuth();
  const [isTradeModalOpen, setIsTradeModalOpen] = React.useState(false);

   // Zustände für das Ausklappen der Tabellen
   const [showOpenTrades, setShowOpenTrades] = useState(false);
  // Handler für das Ausklappen
  const toggleOpenTrades = () => setShowOpenTrades(!showOpenTrades);

 // Hook, um die Anzahlen abzurufen
 const openTradesCount = useTradeCount('http://localhost:8000/api/trades/trade/count/open', token);
 const closedTradesCount = useTradeCount('http://localhost:8000/api/trades/trade/count/closed', token);
 const totalTradesCount = useTradeCount('http://localhost:8000/api/trades/trade/count/total', token);

 return (
<div className="max-w-7xl mx-auto my-10 p-5 border rounded-lg shadow-lg">
  <h1 className="text-4xl font-bold mb-4 text-center">Dashboard</h1>
  <div className="mb-6 bg-gray-100 p-4 rounded">
    <p className="mb-2 text-lg">Benutzername: <span className="font-semibold">{user ? user.username : 'Unbekannter Nutzer'}</span></p>
    <p className="mb-4 text-lg">Benutzer-ID: <span className="font-semibold">{user ? user.id : 'Unbekannte ID'}</span></p>
    
    <p className="mb-2 text-lg">Anzahl offener Verhandlungen: <span className="font-semibold">{openTradesCount}</span></p>
    <p className="mb-2 text-lg">Anzahl geschlossener Verhandlungen: <span className="font-semibold">{closedTradesCount}</span></p>
    <p className="text-lg">Gesamtzahl der Verhandlungen im System: <span className="font-semibold">{totalTradesCount}</span></p>
  </div>

  <div className="flex flex-col mb-5 items-center">
    <button onClick={logout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors mb-10">Ausloggen</button>
    <button onClick={() => setIsTradeModalOpen(true)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors w-72">Neue Verhandlung starten</button>
  </div>
      
      {isTradeModalOpen && (
        <CreateNewTradeButton
          onClose={() => setIsTradeModalOpen(false)}
          onSuccess={() => {
            setIsTradeModalOpen(false);
          }}
        />
      )}
      
      { /* Tabellen 
      <div className="mt-8">
        <OpenTrades token={token} userId={user?.id} />
        <GlobalLastTrades token={token} />
        <UserConfirmedTrades token={token} />
        <UserLastDeniedTrades token={token} />   
        <UserLastClosedTrades token={token} />
      </div>
      */ }

      <div className="mt-8">
            <div className="mb-8">
              <OpenTrades token={token} userId={user?.id} />
            </div>
            <hr className="my-8 border-t" />
            <div className="mb-8">
              <GlobalLastTrades token={token} />
            </div>
            <hr className="my-8 border-t" />
            <div className="mb-8">
              <UserConfirmedTrades token={token} />
            </div>
            <hr className="my-8 border-t" />
            <div className="mb-8">
              <UserLastDeniedTrades token={token} />
            </div>
            <hr className="my-8 border-t" />
            <div className="mb-8">
              <UserLastClosedTrades token={token} />
            </div>
      </div>
    </div>    
  );
};

export default Dashboard;