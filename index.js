const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// AMBIL DARI ENVIRONMENT VARIABLE
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'kependudukan_db'; // Nama database kita

if (!MONGODB_URI) {
    console.error("FATAL: MONGODB_URI belum di-set di Vercel!");
}

app.get('/', (req, res) => res.send('Microservice Register: ONLINE'));

app.post('/api/register', async (req, res) => {
    // 1. Tangkap semua data dari Frontend
    const { 
        email, password, 
        nik, nama, tempatLahir, tanggalLahir, 
        jenisKelamin, alamat, agama, status, pekerjaan 
    } = req.body;

    // 2. Validasi Sederhana
    if (!email || !password || !nik || !nama) {
        return res.status(400).json({ error: "Data pokok (Email, Pass, NIK, Nama) wajib diisi!" });
    }

    let client;
    try {
        // 3. Koneksi ke Database
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');

        // 4. Cek apakah Email atau NIK sudah ada
        const existingUser = await usersCollection.findOne({ 
            $or: [{ email: email }, { nik: nik }] 
        });

        if (existingUser) {
            return res.status(400).json({ error: "Email atau NIK sudah terdaftar!" });
        }

        // 5. Enkripsi Password (Biar aman kayak hacker beneran)
        const hashedPassword = await bcrypt.hash(password, 10);

        // 6. Siapkan Data Penduduk Lengkap
        const newUser = {
            email,
            password: hashedPassword,
            nik,
            nama,
            tempatLahir,
            tanggalLahir,
            jenisKelamin,
            alamat,
            agama,
            status,
            pekerjaan,
            createdAt: new Date()
        };

        // 7. Simpan ke Database
        await usersCollection.insertOne(newUser);

        res.status(201).json({ message: "Registrasi Berhasil! Data Penduduk Tersimpan." });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ error: "Terjadi kesalahan server database" });
    } finally {
        if (client) client.close();
    }
});

// Jalankan Server (Untuk Localhost)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server Register jalan di port ${PORT}`));

// Export untuk Vercel
module.exports = app;