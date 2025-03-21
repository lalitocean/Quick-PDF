import mongoose from "mongoose";

// Define the schema
const contentSchema = new mongoose.Schema({
    tgId: {
        type: String,
        required: true,
    },
    contents: [
        {
            content: {
                type: String,
                required: true,
            },
            moveDown: {
                type: Boolean,
                default: false,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    columnValue: { type: Number, default: 3 },
    marginValue: { type: String, default: 'narrow' },
    fontSize: { type: Number, default: 7 }

}, { timestamps: true });

// Create the model for the content
export const ContentModal = mongoose.model('Content', contentSchema);


