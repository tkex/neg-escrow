import { Server } from "socket.io";
import { TradeModel } from './models/Trade.js';
import { Chat } from './models/Chat.js';
import jwt from 'jsonwebtoken';

const initSocket = (server) => {

  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }
  });

  io.use((socket, next) => {

    const token = socket.handshake.query.token;

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error("Fehler bei der Authentifizierung."));
      socket.userId = decoded.userId;

      next();
    });
  });

  io.on("connection", (socket) => {
    console.log("Ein Benutzer ist verbunden", socket.userId);

    socket.on("joinTrade", async ({ tradeId }) => {

      const userId = socket.userId;
      const trade = await TradeModel.findById(tradeId);

      if (trade && (trade.sender.toString() === userId || trade.receiver.toString() === userId) && trade.status === 'pending') {
        socket.join(tradeId);
        console.log(`Benutzer ${userId} ist dem Chatraum für die Verhandlung (Trade) ${tradeId} beigetreten`);
      }
      else {
        socket.emit("error", "Beitritt zum Verhandlungschat nicht möglich.");
      }
    });

    socket.on("sendMessage", async ({ tradeId, message }) => {
      const userId = socket.userId;
      const trade = await TradeModel.findById(tradeId);

      if (trade && (trade.sender.toString() === userId || trade.receiver.toString() === userId) && trade.status === 'pending') {

        const chatMessage = { sender: userId, message };
        await Chat.findOneAndUpdate({ tradeId }, { $push: { messages: chatMessage } }, { new: true, upsert: true });

        io.to(tradeId).emit("receiveMessage", {
          tradeId,
          message: chatMessage.message,
          sender: userId,
          createdAt: chatMessage.createdAt
        });
      }
      else {
        socket.emit("error", "Nachricht konnte nicht gesendet werden.");
      }
    });
  });

  return io;
};

export default initSocket;
