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

 // Hook, um die Anzahlen abzurufen
 const openTradesCount = useTradeCount('http://localhost:8000/trades/count/open', token);
 const closedTradesCount = useTradeCount('http://localhost:8000/trades/count/closed', token);
 const totalTradesCount = useTradeCount('http://localhost:8000/trades/count/total', token);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Benutzername: {user ? user.username : 'Unbekannter Nutzer'}</p>
      <p>Benutzer-ID: {user ? user.id : 'Unbekannte ID'}</p>
      <div>
        <p>Anzahl offener Verhandlungen: {openTradesCount}</p>
        <p>Anzahl geschlossener Verhandlungen: {closedTradesCount}</p>
        <p>Gesamtzahl der Verhandlungen im System: {totalTradesCount}</p>
      </div>
      <button onClick={logout}>Logout</button>
      <hr />
      <button onClick={() => setIsTradeModalOpen(true)}>Neue Verhandlung starten</button>
      
      {isTradeModalOpen && (
        <CreateNewTradeButton
          onClose={() => setIsTradeModalOpen(false)}
          onSuccess={() => {
            setIsTradeModalOpen(false);
          }}
        />
      )}
      <hr />
      <OpenTrades token={token} userId={user?.id} />
      <hr />
      <GlobalLastTrades token={token} />
      <hr />
      <UserConfirmedTrades token={token} />
      <hr />
      <UserLastDeniedTrades token={token} />   
      <hr />
      <UserLastClosedTrades token={token} />      
    </div>
  );
};

export default Dashboard;