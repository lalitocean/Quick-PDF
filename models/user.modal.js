
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    tgId: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String
    },
    userName: {
        type: String,

    },
    isBot: {
        type: Boolean,
        required: true
    },
    promptTokens: {
        type: Number,
        required: false
    },
    completionTokens: {
        type: Number,
        required: false
    }

}, { timestamps: true })


export const User = mongoose.model('User', userSchema);
