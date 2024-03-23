import express from "express"
import mongoose from "mongoose"
import dotenv from "dotenv"
import bcrypt from 'bcrypt';


const app = express();
dotenv.config();

// Middleware to handle JSON requests
app.use(express.json());

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
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
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
        res.status(201).json({ message: "Benutzer erfolgreich registriert." });
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
            // Successful Login
            res.json({ message: "Erfolgreich angemeldet!" });
        } else {            
            // Login failed
            res.status(400).json({ message: "Anmeldung fehlgeschlagen!" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


const tradeSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tradeType: {
        type: String,
        enum: ['Angebot'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    senderConfirmed: {
        type: Boolean,
        default: false
    },
    receiverConfirmed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const TradeModel = mongoose.model("Trade", tradeSchema);

// Route für Handelsanfrage senden
app.post("/trade/request", async (req, res) => {
    try {
        // Get tradeId, userId, tradeType from the passed request body
        const { sender, receiver, tradeType } = req.body;

        // Checking tradeType; if different than 'Angebot', return 400 error
        if (!['Angebot'].includes(tradeType)) {
            return res.status(400).json({ message: "Ungültiger Handelstyp." });
        }

        // New TradeModel instance
        const newTrade = new TradeModel({ sender, receiver, tradeType });

        // Save this trade to database
        await newTrade.save();
        
        // If the trade is successfully saved, show 201 status + msg.
        res.status(201).json({ message: "Handelsanfrage gesendet." });
        
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Route für Handelsanfrage annehmen/ablehnen
app.post("/trade/confirm", async (req, res) => {
    try {
        // Get tradeId and userId from the passed request body
        const { tradeId, userId } = req.body;

        // Find trade in the database via its tradeId
        const trade = await TradeModel.findById(tradeId);
        
        // Check first if the trade exists and if user has permission to confirm it
        if (!trade || (trade.sender.toString() !== userId && trade.receiver.toString() !== userId)) {
            return res.status(404).json({ message: "Handel nicht gefunden (oder keine Berechtigung)." });
        }
        
        // Set sender or receiver ti have confirmed the trade (depending on who is making the request)
        if (trade.sender.toString() === userId) {
            trade.senderConfirmed = true;
        } else if (trade.receiver.toString() === userId) {
            trade.receiverConfirmed = true;
        }
        
        // If both - sender and receiver - have confirmed, change trade status to confirmed
        if (trade.senderConfirmed && trade.receiverConfirmed) {
            trade.status = 'confirmed';
        }
        
        // Save this trades new status to the database
        await trade.save();

        // Show the confirm msg
        res.json({ message: "Handel bestätigt." });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Route für Handel abbrechen
app.post("/trade/cancel", async (req, res) => {
    try {
        // Get tradeId and userId from the passed request body
        const { tradeId, userId } = req.body;

        // Find trade in database via its tradeId
        const trade = await TradeModel.findById(tradeId);
        
        // Check if the trade exists and if the user has permission to cancel it
        if (!trade || (trade.sender.toString() !== userId && trade.receiver.toString() !== userId)) {
            return res.status(404).json({ message: "Handel nicht gefunden oder keine Berechtigung." });
        }
        
       // Trade cannot be cancelled if it has already been confirmed by both parties
       if (trade.status === 'confirmed') {
        return res.status(400).json({ message: "Handel wurde bereits bestätigt und kann nicht abgebrochen werden." });
    }
        // Setting the trade status to status: cancelled
        trade.status = 'cancelled';

        // Save the trades new status        
        await trade.save();

        // Respond with a success msg
        res.json({ message: "Handel abgebrochen." });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});