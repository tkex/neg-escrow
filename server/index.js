import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import bcrypt from 'bcrypt';
import cron from 'node-cron';
import jwt from 'jsonwebtoken';


const app = express();
dotenv.config();

// Middleware um JSON Anfragen zu handlen
app.use(express.json());

// .env für Port und MongoDB URL
const PORT = process.env.PORT || 7000;
const MONGOURL = process.env.MONGO_URL;

mongoose.connect(MONGOURL).then(() => {
    console.log("Datenbank ist verbunden!")
    app.listen(PORT, () => {
        console.log(`Server läuft auf Port ${PORT}`)
    })
}).catch((error) => {
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
app.get("/getUsers", async (req, res) => {
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

     // Sofern kein Token vorhanden ist
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        // Sofern Token nicht gültig ist
        if (err) return res.sendStatus(403);

        // Ansonsten Nutzer setzen
        req.user = user;

        // Überspringen
        next();
    });
};


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
    // Mögliche Stati einer Verhandlung, standardgemäß "pending"
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    // Verhandlungstatus vom Sender, standardgemäß: false
    senderConfirmed: {
        type: Boolean,
        default: false
    },
    // Verhandlungstatus vom Empfänger, standardgemäß: false
    receiverConfirmed: {
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
});

    
const TradeModel = mongoose.model("Trade", tradeSchema);


// Route für Handelsanfrage senden
app.post("/trade/request", authenticate, async (req, res) => {
    try {
        const { sender, receiver, tradeType, initOffer } = req.body;

        // Prüfe ob tradeType richtig ist
        if (tradeType !== 'Angebot') {
            return res.status(400).json({ message: "Ungültiger Handelstyp." });
        }

        // Erstelle neue Verhandelsanfrage
        const newTrade = new TradeModel({
            sender,
            receiver,
            tradeType,
            initOffer,
            currentOffer: initOffer, // Setze initOffer als currentOffer
            lastOfferBy: 'sender', // Sender hat das erste Angebot gemacht
            senderConfirmed: true, // Setze senderConfirmed auf true
            offerHistory: [initOffer] // Füge initOffer zur offerHistory hinzu
        });
        

        // Sender hat das erste Angebot gemacht
        await newTrade.save();
        res.status(201).json({ message: "Handelsanfrage gesendet.", tradeId: newTrade._id });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Route für Handelsanfrage annehmen/ablehnen
app.post("/trade/confirm", authenticate, async (req, res) => {
    try {
        // Action kann accept, reject oder counter sein
        const { tradeId, userId, action, counterOffer } = req.body;

        const trade = await TradeModel.findById(tradeId);
        if (!trade) {
            return res.status(404).json({ message: "Handel nicht gefunden." });
        }

        // Handel ablehnen
        if (action === 'reject') {
            trade.status = 'rejected';
            await trade.save();
            return res.json({ message: "Handel abgelehnt." });
        }

  
        // Gegenangebot machen
        if (action === 'counter' && counterOffer) {
            // Bestimme, ob der aktuelle Nutzer der Empfänger oder Sender ist
            let isReceiver = trade.receiver.toString() === userId;
            let isSender = trade.sender.toString() === userId;

            // Logik für Empfänger, um ein Gegenangebot zu machen
            if (isReceiver && trade.lastOfferBy === 'sender' && !trade.receiverHasMadeCounterOffer) {
                trade.receiverHasMadeCounterOffer = true;

                trade.counterOffer = counterOffer;
                trade.offerHistory.push(counterOffer);
                trade.currentOffer = counterOffer;
                trade.lastOfferBy = 'receiver';

                // Setze senderConfirmed auf false und receiverConfirmed auf true
                trade.senderConfirmed = false;
                trade.receiverConfirmed = true;

                await trade.save();
                return res.json({ message: "Gegenangebot gemacht." });
            }
            // Logik für Sender, um ein Gegenangebot zu machen
            else if (isSender && trade.lastOfferBy === 'receiver' && !trade.senderHasMadeCounterOffer) {
                trade.senderHasMadeCounterOffer = true;

                trade.counterOffer = counterOffer;
                trade.offerHistory.push(counterOffer);
                trade.currentOffer = counterOffer;
                trade.lastOfferBy = 'sender';
                
                // Setze senderConfirmed auf true und receiverConfirmed auf false
                trade.senderConfirmed = true;
                trade.receiverConfirmed = false;

                await trade.save();
                return res.json({ message: "Gegenangebot gemacht." });
            } else {
                return res.status(400).json({ message: "Ein Gegenangebot kann unter diesen Umständen nicht gemacht werden." });
            }
        }


        // Handel annehmen
        if (action === 'accept') {

            // Überprüfe, ob der Nutzer berechtigt ist, den Handel zu akzeptieren
            if ((trade.receiver.toString() === userId && trade.lastOfferBy === 'sender') || 
                (trade.sender.toString() === userId && trade.lastOfferBy === 'receiver')) {

                // trade.status = 'accepted';

                trade.acceptedPrice = trade.currentOffer;

                if (trade.sender.toString() === userId) {
                    // Setze senderConfirmed auf true (zwar bereits im Request)
                    trade.senderConfirmed = true;
                } else if (trade.receiver.toString() === userId) {
                    // Setze receiverConfirmed auf true, wenn der Empfänger akzeptiert
                    trade.receiverConfirmed = true;
                }
                // Wenn beide Parteien bestätigt haben, aktualisiere den Status auf 'accepted'
                if (trade.senderConfirmed && trade.receiverConfirmed) {
                    trade.status = 'accepted';
                }

                await trade.save();

                return res.json({ message: "Handel akzeptiert." });
            } else {
                return res.status(400).json({ message: "Nicht berechtigt, den Handel zu akzeptieren." });
            }
        }

        res.status(400).json({ message: "Ungültige Aktion." });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route für Handel abbrechen
app.post("/trade/cancel", authenticate, async (req, res) => {
    try {
        const { tradeId, userId } = req.body;

        // Finde den Handel in der Datenbank mit der tradeId
        const trade = await TradeModel.findById(tradeId);

        // Prüfe, ob der Handel existiert und ob der Nutzer berechtigt ist, ihn zu stornieren
        if (!trade) {
            return res.status(404).json({ message: "Handel nicht gefunden." });
        }

        // Prüfe, ob der Benutzer entweder der Sender oder der Empfänger des Handels ist
        if (trade.sender.toString() !== userId && trade.receiver.toString() !== userId) {
            return res.status(403).json({ message: "Keine Berechtigung, diesen Handel abzubrechen." });
        }

        // Handel kann nicht abgebrochen werden, wenn er bereits akzeptiert wurde
        if (trade.status === 'accepted') {
            return res.status(400).json({ message: "Handel wurde bereits akzeptiert und kann nicht abgebrochen werden." });
        }

        // Setze den Handelsstatus auf 'cancelled'
        trade.status = 'cancelled';
        await trade.save();

        // Antworte positiv
        res.json({ message: "Handel erfolgreich abgebrochen." });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route für Gegenangebote
app.post("/trade/counteroffer", authenticate, async (req, res) => {
    try {
        const { tradeId, userId, counterOffer } = req.body;

        const trade = await TradeModel.findById(tradeId);

        if (!trade) {
            return res.status(404).json({ message: "Handel nicht gefunden." });
        }

        if (trade.status !== 'pending') {
            return res.status(400).json({ message: "Gegenangebote sind nur im 'pending' Status möglich." });
        }

        // Überprüfe, ob der Empfänger ein Gegenangebot machen möchte
        if (trade.receiver.toString() === userId && trade.lastOfferBy === 'sender' && !trade.receiverHasMadeCounterOffer) {

            trade.receiverHasMadeCounterOffer = true;
            trade.counterOffer = counterOffer;
            trade.offerHistory.push(counterOffer);
            trade.currentOffer = counterOffer;

            trade.lastOfferBy = 'receiver';
            await trade.save();

            return res.json({ message: "Gegenangebot gesendet." });
        }
        // Überprüfe, ob der Sender ein Gegenangebot nach dem des Empfängers machen möchte
        else if (trade.sender.toString() === userId && trade.lastOfferBy === 'receiver' && !trade.senderHasMadeCounterOffer) {
            trade.senderHasMadeCounterOffer = true;

            trade.counterOffer = counterOffer;
            trade.offerHistory.push(counterOffer);
            trade.currentOffer = counterOffer;
            trade.lastOfferBy = 'sender';

            await trade.save();

            return res.json({ message: "Gegenangebot gesendet." });
        } else {
            return res.status(400).json({ message: "Ein Gegenangebot kann unter diesen Umständen nicht gemacht werden." });
        }
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