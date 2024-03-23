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

// Route to get users
app.get("/getUsers", async (req, res) => {
    const users = await UserModel.find();
    res.json(users);
});


/*
app.post("/register", async (req, res) => {
    try {
        // Create new user object from POST request
        const newUser = new UserModel(req.body); 
        // Save the user in the db
        const savedUser = await newUser.save();
        // Send saved user as response
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
*/

// Route for register new user
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

// Route for user login
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
