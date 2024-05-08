import jwt from 'jsonwebtoken';

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


export default authenticate;
