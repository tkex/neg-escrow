import mongoose from "mongoose";

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

    
export const TradeModel = mongoose.model("Trade", tradeSchema);