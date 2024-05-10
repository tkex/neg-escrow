import jwt from 'jsonwebtoken';

// Middleware für die Überprüfung des Authentifizierungstokens
const authenticate = (req, res, next) => {

    // Authorization-Headers    
    const authHeader = req.headers['authorization'];
    // Bearer-Tokens vom Header holen
    const token = authHeader && authHeader.split(' ')[1];

    // Kein Token gefunden dh. Zugriff verweigern
    if (token == null) return res.sendStatus(401);

    // Überprüfen des Tokens (siehe Geheimnis in Umgebungsvariable)
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {

        // Bei Fehler beim Überprüfen des Tokens Zugriff verweigern
        if (err) return res.sendStatus(403);

        // Füge Benutzerobjekt zur Anfrage hinzu
        req.user = user;
        console.log("Authentifizierter Benutzer:", req.user);

        next();
    });
};

export default authenticate;
