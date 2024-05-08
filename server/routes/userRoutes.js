
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();


// Route für User Abfrage (get)
router.get("/users", async (req, res) => {
    const users = await UserModel.find();
    res.json(users);
});


// Route für Registrierung
router.post("/register", async (req, res) => {
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
router.post("/login", async (req, res) => {
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

router.get("/verifyToken", authenticate, (req, res) => {
    
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


export default router;
