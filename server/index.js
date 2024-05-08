import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from 'bcrypt';
import cron from 'node-cron';
import jwt from 'jsonwebtoken';
import cors from 'cors';
// Socket.IO
import { createServer } from "http";
import { Server } from "socket.io";


import { UserModel } from './models/User.js';
import { TradeModel } from './models/Trade.js';
import { Chat } from './models/Chat.js';

import authenticate from './middleware/authenticate.js';

import userRoutes from './routes/userRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
//import authRoutes from './routes/authRoutes.js';






const app = express();
dotenv.config();

// Aktiviere CORS für alle Anfragen
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  

// Middleware um JSON Anfragen zu handlen
app.use(express.json());



app.use('/api/users', userRoutes);
app.use('/api/trades', tradeRoutes);



// .env für Port und MongoDB URL
const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL;

mongoose.connect(MONGOURL)
  .then(() => {
    console.log("Datenbank ist verbunden!");
  })
  .catch((error) => {
    console.log(error);
  });





  







// Ein Cron-Job (jede Stunde prüfen)
// Wenn refaktorisiert wird, dann Modelle in derselben Datei importieren dh. import { TradeModel } from './models/Trade';
cron.schedule('0 * * * *', async () => {

    console.log('Cron-Job gestartet: Überprüfe Handelsanfragen auf Timeout.');

    // Jetziger Zeitpunkt
    const now = new Date();

    // Alle Handelsanfragen, die über 48 Stunden sind
    const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

    try {
        // Finde Handelsanfragen, die älter als 48 Stunden sind und noch im Status 'pending' stehen
        const trades = await TradeModel.find({
            createdAt: { $lte: twoDaysAgo },
            status: 'pending'
        });

        if (trades.length > 0) {

            console.log(`Es wurden ${trades.length} Handelsanfragen gefunden, die abgebrochen werden.`);

            for (const trade of trades) {
                trade.status = 'cancelled';
                await trade.save();
            }

            console.log('Alle betroffenen Handelsanfragen wurden erfolgreich abgebrochen.');
        } else {

            console.log('Keine Handelsanfragen zum Abbrechen gefunden.');
        }
    } catch (error) {

        console.error('Fehler beim Ausführen des Cron-Jobs:', error);
    }
});





// Einrichten von httpServer und socket.io
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }
});

httpServer.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
  });





io.use((socket, next) => {
  const token = socket.handshake.query.token;
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error"));
    socket.userId = decoded.userId; // Speichere die userId im Socket für die weitere Verwendung
    next();
  });
});

io.on("connection", (socket) => {
    console.log("Ein Benutzer ist verbunden", socket.userId);
  
    socket.on("joinTrade", async ({ tradeId }) => {
        try {
          const userId = socket.userId; // Verwende die verifizierte userId aus der Middleware
          const trade = await TradeModel.findById(tradeId);
          // Überprüfe, ob der Trade existiert und ob der Benutzer entweder der Sender oder der Empfänger ist
          if (trade && (trade.sender.toString() === userId || trade.receiver.toString() === userId) && trade.status === 'pending') {
            socket.join(tradeId);
            console.log(`Benutzer ${userId} ist dem Raum für Trade ${tradeId} beigetreten`);
          } else {
            socket.emit("error", "Beitritt zum Chat nicht möglich.");
          }
        } catch (error) {
          console.error("Fehler beim Beitritt zum Trade-Chat:", error);
          socket.emit("error", "Ein Fehler ist aufgetreten.");
        }
      });
    
      socket.on("sendMessage", async ({ tradeId, message }) => {
        const userId = socket.userId;
      
        const trade = await TradeModel.findById(tradeId);
        if (trade && (trade.sender.toString() === userId || trade.receiver.toString() === userId) && trade.status === 'pending') {
          const chatMessage = { sender: userId, message };
          
          // Hinzufügen der Nachricht zum Chat-Dokument
          await Chat.findOneAndUpdate({ tradeId }, { $push: { messages: chatMessage } }, { new: true, upsert: true });
          
          io.to(tradeId).emit("receiveMessage", {
            tradeId,
            message: chatMessage.message,
            sender: userId,
            createdAt: chatMessage.createdAt
          });
        } else {
          socket.emit("error", "Nachricht konnte nicht gesendet werden.");
        }
      });
  
    // Weitere Event-Handler...
  });
  





  app.get("/trade/:tradeId/chat", authenticate, async (req, res) => {
    const { tradeId } = req.params;
    const userId = req.user.userId;
  
    const trade = await TradeModel.findById(tradeId);
    if (!trade) {
      return res.status(404).json({ message: "Handel nicht gefunden." });
    }
  
    if (trade.sender.toString() !== userId && trade.receiver.toString() !== userId) {
      return res.status(403).json({ message: "Nicht berechtigt." });
    }
  
    const chat = await Chat.findOne({ tradeId })
      .populate('messages.sender', 'username');
  
    if (!chat) {
      return res.status(404).json({ message: "Keine Nachrichten gefunden." });
    }
  
    res.json(chat.messages);
  });
  
  
