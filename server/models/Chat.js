import mongoose from "mongoose";

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
  
  export const Chat = mongoose.model("Chat", chatSchema);