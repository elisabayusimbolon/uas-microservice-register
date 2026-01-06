const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Koneksi Database
const connectDB = async () => {
    if (mongoose.connections[0].readyState) return;
    await mongoose.connect(process.env.MONGODB_URI);
};

// Model User
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Endpoint REGISTER
app.post('/api/register', async (req, res) => {
    try {
        await connectDB();
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: "Data tidak lengkap" });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email sudah ada" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "Register Berhasil!" });
    } catch (err) {
        res.status(500).json({ error: "Server Error" });
    }
});

app.get('/', (req, res) => res.send('Service Register Ready'));
module.exports = app;

if (require.main === module) app.listen(3000, () => console.log('Register running on 3000'));