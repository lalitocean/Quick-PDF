import mongoose from "mongoose";
import { User } from "./user.modal.js";
import { StringDecoder } from "node:string_decoder";

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [
        {
            type: String,
            required: true,
        }
    ],
    count: {
        type: Number,
        default: 5
    }

}, { timestamps: true });

export const Feedback = mongoose.model('Feedback', feedbackSchema);


