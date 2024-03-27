
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { user, logout } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // TODO: Mit Backend Fetch austauschen
  const letzteTrades = [
    { trade: "Trade 1", status: "Erfolgreich" },
    { trade: "Trade 2", status: "Fehlgeschlagen" },
  ];

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Benutzername: {user ? user.username : 'Unbekannt'}</p>
      <p>Benutzer-ID: {user ? user.id : 'Unbekannt'}</p>

      <p>Heute ist der {currentTime.toLocaleDateString()}</p>
      <p>Aktuelle Uhrzeit: {currentTime.toLocaleTimeString()}</p>

      <button onClick={logout}>Logout</button>

      <div>
        <button>Neue Verhandlung starten</button>
      </div>

      <div>    
        <h2>Letzte Trades</h2>
        <ul>
          {letzteTrades.map((trade, index) => (
            <li key={index}>{trade.trade} - {trade.status}</li>
          ))}
        </ul>
      </div>

      <div>
        <h2>Zuletzt durchgeführten Verhandlungen</h2>
        {/* Platzhalter für die Verhandlungen, ähnlich wie bei den Trades */}
      </div>
    </div>
  );
};

export default Dashboard;
