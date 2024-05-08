import mongoose from "mongoose";

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

export const UserModel = mongoose.model("User", userSchema);
