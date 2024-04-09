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







  

const userSchema = new mongoose.Schema({
    // Email vom Nutzer
    email: {
        type: String,
        required: true,
        unique: true
    }, 
    // Benutzername vom Nutzer
    username: {
        type: String,
        required: true,
        unique: true
    },
    // Passwort vom Nutzer
    password: {
        type: String,
        required: true
    }
});

const UserModel = mongoose.model("User", userSchema);

// Route für User Abfrage (get)
app.get("/users", async (req, res) => {
    const users = await UserModel.find();
    res.json(users);
});


// Route für Registrierung
app.post("/register", async (req, res) => {
    try {

        const { email, username, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new UserModel({
            email,
            username,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({ message: "Benutzer wurde erfolgreich registriert." });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route für User-Login
app.post("/login", async (req, res) => {
    try {

        const { username, password } = req.body;

        const user = await UserModel.findOne({ username });

        if (user && await bcrypt.compare(password, user.password)) {

            // Erfolgreiche Anmeldung
            const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

            res.json({ message: "Erfolgreich angemeldet!", token });
        } else {            
            // Anmeldung fehlgeschlagen
            res.status(400).json({ message: "Anmeldung fehlgeschlagen!" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Middleware für Auth-Token

const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401); // No token was found

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Token verification failed

        req.user = user; // Assuming 'user' object contains 'userId'
        console.log("Authenticated user:", req.user);

        next(); // Proceed to the next middleware/route handler
    });
};

app.get("/verifyToken", authenticate, (req, res) => {
    
    // Nach erfolgreicher Authentifizierung durch Middleware
    UserModel.findById(req.user.userId)

      .then(user => {        
        if (!user) {
          return res.status(404).json({ message: "Benutzer nicht gefunden." });
        }
        // Benutzerdaten zurückgeben
        res.json({ username: user.username, userId: user._id });
      })
      .catch(error => res.status(500).json({ message: error.message }));
  });


const tradeSchema = new mongoose.Schema({
    // Sender
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Empfänger
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Typ der Verhandlung
    tradeType: {
        type: String,
        enum: ['Angebot'],
        required: true
    },
    // Betreff der Anfrage
    subject: {
        type: String,
        required: true,
        maxlength: 100
    },
    // Beschreibung der Anfrage
    description: {
        type: String,
        required: true,
        maxlength: 100
    },
    // Mögliche Stati einer Verhandlung, standardgemäß "pending"
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    // Verhandlungstatus vom Sender, standardgemäß: false
    senderAccepted: {
        type: Boolean,
        default: false
    },
    // Verhandlungstatus vom Empfänger, standardgemäß: false
    receiverAccepted: {
        type: Boolean,
        default: false
    },
    // Datum-Zeitstempel
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Initialangebot vom Sender
    initOffer: {
        type: Number,
        required: true
    },
     // Aktuelles Angebot -- entspricht am Anfang "initialOffer"
    currentOffer: {
        type: Number,
        required: true
    },
    // Auflistung aller Angebote und Gegenangebote zwecks Nachvollziehung
    offerHistory: [{
        type: Number
    }],
    // Der endgültig akzeptierte Preis
    acceptedPrice: {
        type: Number,
        default: null
    },
     // Zeigt, wer das letzte Angebot gemacht hat
    lastOfferBy: {
        type: String,
        enum: ['sender', 'receiver'],
        required: true
    },
    // Speichert, was das Gegenangebot ist
    counterOffer: {
        type: Number,
        default: null
    },
    // Zur Überprüfung, ob ein Gegenangebot gemacht wurde
    senderHasMadeCounterOffer: {
        type: Boolean,
        default: false
    },
    // *
    receiverHasMadeCounterOffer: {
        type: Boolean,
        default: false
    },
    // Zur Definition, ob Verhandlung öffentlich oder privat sein soll
    isConfidential: {
        type: Boolean,
        default: false,
    },
});

    
const TradeModel = mongoose.model("Trade", tradeSchema);


// Route für Handelsanfrage senden
app.post("/trade/request", authenticate, async (req, res) => {
    try {
        const { receiver, tradeType, initOffer, subject, description, isConfidential  } = req.body;

        // req.user ist gesetzt von der Authenticate Middleware und beinhaltet userId
        const sender = req.user.userId;

        // Überprüfen, ob Sender und Empfänger die gleiche Person sind
        if (sender === receiver) {
            return res.status(400).json({ message: "Handelsanfragen an sich selbst sind nicht erlaubt." });
        }

        if (tradeType !== 'Angebot') {
            return res.status(400).json({ message: "Ungültiger Handelstyp." });
        }

        const newTrade = new TradeModel({
            sender,
            receiver,
            tradeType,
            initOffer,
            subject,
            description,
            currentOffer: initOffer,
            lastOfferBy: 'sender',
            senderAccepted: true,
            offerHistory: [initOffer],
            isConfidential
        });

        // Sender hat das erste Angebot gemacht
        await newTrade.save();
        res.status(201).json({ message: "Handelsanfrage gesendet.", tradeId: newTrade._id });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// Route für Handelsanfrage akzeptieren
    app.post("/trade/accept", authenticate, async (req, res) => {
        const { tradeId } = req.body;
        const userId = req.user.userId;
    
        try {
            const trade = await TradeModel.findById(tradeId);
            if (!trade) {
                return res.status(404).json({ message: "Handel nicht gefunden." });
            }
    
            // Wenn der Empfänger das Angebot akzeptiert
            if (trade.receiver.toString() === userId) {
                trade.receiverAccepted = true;
            }
            // Wenn der Sender ein Gegenangebot des Empfängers akzeptiert
            else if (trade.sender.toString() === userId && trade.receiverHasMadeCounterOffer) {
                trade.senderAccepted = true;
            }
            else {
                return res.status(403).json({ message: "Nicht berechtigt." });
            }
    
            // Wenn beide Parteien akzeptiert haben
            if (trade.senderAccepted && trade.receiverAccepted) {
                trade.status = 'confirmed';
                // Setze acceptedPrice auf den letzten Preis aus offerHistory oder currentOffer, falls offerHistory leer ist
                // Alternativ auch aus currentOffer
                trade.acceptedPrice = trade.offerHistory.length > 0 ? trade.offerHistory[trade.offerHistory.length - 1] : trade.currentOffer;
            }
    
            await trade.save();
            res.json({ message: "Handel erfolgreich akzeptiert." });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });
    


// Route für Handelsanfrage ablehnen
app.post("/trade/reject", authenticate, async (req, res) => {
    const { tradeId } = req.body;
    const userId = req.user.userId;

    try {
        const trade = await TradeModel.findById(tradeId);
        if (!trade) {
            return res.status(404).json({ message: "Handel nicht gefunden." });
        }

        // Sowohl Sender als auch Empfänger können den Handel ablehnen
        if (trade.sender.toString() === userId || trade.receiver.toString() === userId) {
            trade.status = 'rejected';
            await trade.save();
            res.json({ message: "Handel erfolgreich abgelehnt." });
        } else {
            return res.status(403).json({ message: "Nicht berechtigt." });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route für Gegenangebote

app.post("/trade/counteroffer", authenticate, async (req, res) => {
    const { tradeId, counterOffer } = req.body;
    const userId = req.user.userId;

    try {
        const trade = await TradeModel.findById(tradeId);
        if (!trade) {
            return res.status(404).json({ message: "Handel nicht gefunden." });
        }

        if (trade.status !== 'pending' && trade.status !== 'confirmed') {
            return res.status(400).json({ message: "Gegenangebote sind nur für offene Handelsanfragen möglich." });
        }

        // Empfänger macht ein Gegenangebot, überprüft, ob bereits ein Gegenangebot gemacht wurde
        if (trade.receiver.toString() === userId) {
            if (trade.receiverHasMadeCounterOffer) {
                // Fehlermeldung, wenn bereits ein Gegenangebot vom Empfänger gemacht wurde
                return res.status(400).json({ message: "Sie haben bereits ein Gegenangebot gemacht." });
            }
            trade.receiverHasMadeCounterOffer = true;
            trade.senderAccepted = false;
            trade.receiverAccepted = true;
        } 
        // Sender macht ein Gegenangebot nach einem Gegenangebot des Empfängers, überprüft, ob bereits ein Gegenangebot gemacht wurde
        else if (trade.sender.toString() === userId) {
            if (trade.senderHasMadeCounterOffer || !trade.receiverHasMadeCounterOffer) {
                // Fehlermeldung, wenn der Sender bereits ein Gegenangebot gemacht hat oder der Empfänger noch kein Gegenangebot gemacht hat
                return res.status(400).json({ message: "Ein weiteres Gegenangebot kann nicht gemacht werden." });
            }
            trade.senderHasMadeCounterOffer = true;
            trade.receiverAccepted = false;
            trade.senderAccepted = true;
        }
        else {
            return res.status(403).json({ message: "Nicht berechtigt." });
        }

        trade.counterOffer = counterOffer;
        trade.offerHistory.push(counterOffer);
        trade.currentOffer = counterOffer;
        trade.lastOfferBy = (trade.receiver.toString() === userId) ? 'receiver' : 'sender';

        await trade.save();
        res.json({ message: "Gegenangebot erfolgreich gemacht." });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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





// Route um die letzten 10 Verhandlungen anzuzeigen (generell und nicht user-spezifisch)
app.get("/trades/global-lasttrades", async (req, res) => {
    try {
        const lastTrades = await TradeModel.find().sort({ createdAt: -1 }).limit(10);

        res.json(lastTrades);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Route um die offenen Verhandlungen des eingeloggten Benutzers anzuzeigen
app.get("/user/open-trades", authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        const openTrades = await TradeModel.find({
            $or: [{ sender: userId }, { receiver: userId }],
            status: 'pending'
        }).populate([{ path: 'sender', select: 'username _id' }, { path: 'receiver', select: 'username _id' }]);
        

        res.json(openTrades);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Route um die letzten 10 Trades des eingeloggten Users (user-spezifisch) anzuzeigen
app.get("/trades/user-lasttrades", authenticate, async (req, res) => {
    try {
        // Der eingeloggte Benutzer ist in req.user verfügbar, nachdem die authenticate Middleware durchlaufen wurde
        const userId = req.user.userId;

        // Suche nach Trades, bei denen der Benutzer entweder Sender oder Empfänger ist
        const userTrades = await TradeModel.find({
            $or: [
                { sender: mongoose.Types.ObjectId(userId) },
                { receiver: mongoose.Types.ObjectId(userId) }
            ]
        })
         // Sortiere  nach dem Erstellungsdatum (neueste zuerst) und die letzten 10 Einträge
        .sort({ createdAt: -1 })
        .limit(10);

        res.json(userTrades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Route für durchgeführte Trades des eingeloggten Benutzers
app.get("/trades/confirmed", authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        const acceptedTrades = await TradeModel.find({
            $or: [{ sender: userId }, { receiver: userId }],
            status: 'confirmed'
        }).populate('sender receiver', 'username');

        res.json(acceptedTrades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});



// Route für geschlossene Trades des eingeloggten Benutzers
app.get("/trades/denied", authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        const closedTrades = await TradeModel.find({
            $or: [{ sender: userId }, { receiver: userId }],
            status: { $in: ['rejected', 'cancelled'] }
        }).populate('sender receiver', 'username');

        res.json(closedTrades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route für abgeschlossene Trades des eingeloggten Benutzers
app.get("/trades/closed", authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        const closedTrades = await TradeModel.find({
            $or: [{ sender: userId }, { receiver: userId }],
            status: { $in: ['confirmed','rejected', 'cancelled'] }
        }).populate('sender receiver', 'username');

        res.json(closedTrades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Anzahl der offenen Verhandlungen eines Benutzers
app.get("/trades/count/open", authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;

        const count = await TradeModel.countDocuments({
            $or: [{ sender: userId }, { receiver: userId }],
            status: 'pending'
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Anzahl der geschlossener Verhandlungen eines Benutzers
app.get("/trades/count/closed", authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const count = await TradeModel.countDocuments({
            $or: [{ sender: userId }, { receiver: userId }],
            status: { $in: ['accepted', 'rejected', 'cancelled'] }
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Anzahl aller Verhandlungen im System
app.get("/trades/count/total", async (req, res) => {
    try {
        const count = await TradeModel.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
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


// Socket.IO Konfiguration
const chatSchema = new mongoose.Schema({
    tradeId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Trade'
    },
    messages: [{
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
      },
      receiver: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
      },
      message: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  });
  
  const Chat = mongoose.model("Chat", chatSchema);


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
  
  
