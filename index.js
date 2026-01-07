const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Koneksi ke Database
const client = new MongoClient(process.env.MONGODB_URI);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("microservice_db"); // Pastikan nama DB sama
        console.log("Database Connected!");
    } catch (error) {
        console.error("Database Error:", error);
    }
}
connectDB();

app.get('/', (req, res) => res.send('Microservice Register KTP Ready!'));

// ENDPOINT REGISTER (SEKARANG MENERIMA DATA KTP)
app.post('/api/register', async (req, res) => {
    try {
        // Menerima data lengkap dari Frontend
        const { email, password, nik, nama, tempatLahir, tanggalLahir, jenisKelamin, alamat, agama, status, pekerjaan } = req.body;

        if (!email || !password || !nik || !nama) {
            return res.status(400).json({ error: "Data tidak lengkap! Email, Password, NIK, dan Nama wajib diisi." });
        }

        const usersCollection = db.collection('users');

        // Cek apakah Email atau NIK sudah terdaftar
        const existingUser = await usersCollection.findOne({ $or: [{ email }, { nik }] });
        if (existingUser) {
            return res.status(400).json({ error: "Email atau NIK sudah terdaftar!" });
        }

        // Simpan Data KTP Lengkap
        const newUser = {
            email,
            password, // Di dunia nyata password harus di-hash (dienkripsi), tapi untuk belajar ini oke.
            ktp: {
                nik,
                nama,
                tempatLahir,
                tanggalLahir,
                jenisKelamin,
                alamat,
                agama,
                status,
                pekerjaan
            },
            createdAt: new Date()
        };

        await usersCollection.insertOne(newUser);

        res.status(201).json({ message: "Data Penduduk Berhasil Didaftarkan!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Terjadi kesalahan server" });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Register Service running on port ${PORT}`));

module.exports = app;