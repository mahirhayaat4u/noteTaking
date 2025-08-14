// --- server.js ---

require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const uri = process.env.MONGO_URI;
if (!uri) {
    throw new Error('MONGO_URI not found in .env file');
}
const client = new MongoClient(uri);
let notesCollection;

async function connectDB() {
    try {
        await client.connect();
        console.log("✅ Successfully connected to MongoDB Atlas!");
        const database = client.db("notesApp");
        notesCollection = database.collection("notes");
    } catch (err) {
        console.error("❌ Failed to connect to MongoDB", err);
        process.exit(1);
    }
}

// --- API Routes ---

// GET all notes
app.get('/api/notes', async (req, res) => {
    try {
        const notes = await notesCollection.find({}).sort({ timestamp: -1 }).toArray();
        res.status(200).json(notes);
    } catch (err) {
        res.status(500).json({ message: "Error fetching notes" });
    }
});

// POST a new note
app.post('/api/notes', async (req, res) => {
    try {
        const { title, content } = req.body;
        const newNote = { title, content, timestamp: new Date() };
        const result = await notesCollection.insertOne(newNote);
        // The inserted document is available in result.ops[0] or you can just return the newNote object
        res.status(201).json({ ...newNote, _id: result.insertedId });
    } catch (err) {
        res.status(500).json({ message: "Error creating note" });
    }
});

// PUT (update) a note
app.put('/api/notes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        const result = await notesCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { title, content, timestamp: new Date() } }
        );
        if (result.matchedCount === 0) return res.status(404).json({ message: "Note not found" });
        res.status(200).json({ message: "Note updated" });
    } catch (err) {
        res.status(500).json({ message: "Error updating note" });
    }
});

// DELETE a note
app.delete('/api/notes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await notesCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).json({ message: "Note not found" });
        res.status(200).json({ message: "Note deleted" });
    } catch (err) {
        res.status(500).json({ message: "Error deleting note" });
    }
});

// Start the server
connectDB().then(() => {
    app.listen(port, () => {
        console.log(`🚀 Server running on http://localhost:${port}`);
    });
});