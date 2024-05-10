import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from 'cors';
import { createServer } from "http";
import { setupCronJobs } from './cronJob.js';
import userRoutes from './routes/userRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import initSocket from './chatSocket.js';

const app = express();
dotenv.config();

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/trades', tradeRoutes);

const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL;

mongoose.connect(MONGOURL).then(() => {
  console.log("Datenbank ist verbunden!");
}).catch((error) => {
  console.log(error);
});

const httpServer = createServer(app);
setupCronJobs();

 // Initialisiere Socket.IO
const io = initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
