// Importiere socket.io-client als ES Modul
import { io } from 'socket.io-client';

// Erstelle eine Verbindung zum Socket.IO Server
const socket = io('http://localhost:8000', {
    // Füge den Authentifizierungstoken als Query-Parameter hinzu
    query: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjBmMzliMjVjZTU0MWMxMWEzOGZkYmMiLCJpYXQiOjE3MTIyNzM5MDIsImV4cCI6MTcxMjM2MDMwMn0.BIrl5UZY9-YSjmqv_6xx_3mTxlK6Uugx0wSYFC9BQoY'
    }
});

socket.on('connect', () => {
    console.log('Verbunden mit dem Server');

    // Tritt einem spezifischen Trade-Chat bei, indem das joinTrade Ereignis gesendet wird
    // Stelle sicher, dass die tradeId einer existierenden Handelsanfrage entspricht, deren Status 'pending' ist
    socket.emit('joinTrade', { tradeId: '660f3aa25ce541c11a38fdc2' });

    // Höre auf Nachrichten vom Server durch das receiveMessage Ereignis
    socket.on('receiveMessage', (message) => {
        console.log('Nachricht erhalten:', message);
    });

    // Simuliere das Senden einer Nachricht nach einer kurzen Verzögerung
    setTimeout(() => {
        socket.emit('sendMessage', { tradeId: '660f3aa25ce541c11a38fdc2', message: 'Hallo, dies ist eine Testnachricht!' });
    }, 3000);
});

socket.on('disconnect', () => {
    console.log('Vom Server getrennt');
});

socket.on('error', (error) => {
    console.log('Fehler:', error);
});
