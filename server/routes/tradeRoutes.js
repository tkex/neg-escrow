
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { TradeModel } from '../models/Trade.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();


// Route für Handelsanfrage senden
router.post("/trade/request", authenticate, async (req, res) => {
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
router.post("/trade/accept", authenticate, async (req, res) => {
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
router.post("/trade/reject", authenticate, async (req, res) => {
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

router.post("/trade/counteroffer", authenticate, async (req, res) => {
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





// Route um die letzten 10 Verhandlungen anzuzeigen (generell und nicht user-spezifisch)
router.get("/trade/global-lasttrades", async (req, res) => {
    try {
        const lastTrades = await TradeModel.find().sort({ createdAt: -1 }).limit(10);

        res.json(lastTrades);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Route um die offenen Verhandlungen des eingeloggten Benutzers anzuzeigen
router.get("/trade/open-trades", authenticate, async (req, res) => {
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
router.get("/trade/user-lasttrades", authenticate, async (req, res) => {
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
router.get("/trade/confirmed", authenticate, async (req, res) => {
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
router.get("/trade/denied", authenticate, async (req, res) => {
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
router.get("/trade/closed", authenticate, async (req, res) => {
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
router.get("/trade/count/open", authenticate, async (req, res) => {
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
router.get("/trade/count/closed", authenticate, async (req, res) => {
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
router.get("/trade/count/total", async (req, res) => {
    try {
        const count = await TradeModel.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});




export default router;
