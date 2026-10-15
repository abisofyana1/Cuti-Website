import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Client } = pg;

// 1. Connection Config (DB Awal: 'postgres')
const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'postgres', // Connect to default DB first to drop/create
    password: 'admin',    // PASSWORD ANDA
    port: 5432
};

// 2. Baca file SQL 'ecuti_db_pg.sql'
const sqlFilePath = path.join(process.cwd(), 'ecuti_db_pg.sql');

const setupDatabase = async () => {
    let client = new Client(dbConfig);

    try {
        console.log("🔄 Menghubungkan ke PostgreSQL (database: postgres)...");
        await client.connect();

        // 3. Drop & Create Database
        console.log("⚠️  Resetting Database 'ecuti_db'...");
        try {
            await client.query("DROP DATABASE IF EXISTS ecuti_db");
        } catch (err) {
            console.log("Info: " + err.message);
        }

        try {
            await client.query("CREATE DATABASE ecuti_db");
            console.log("✅ Database 'ecuti_db' created.");
        } catch (err) {
            console.log("Info: " + err.message);
        }

        await client.end();

        // 4. Reconnect to 'ecuti_db'
        console.log("🔄 Menghubungkan ke 'ecuti_db'...");
        const appConfig = { ...dbConfig, database: 'ecuti_db' };
        client = new Client(appConfig);
        await client.connect();

        // 5. Read & Execute SQL Dump
        console.log("📂 Membaca file migrasi SQL...");
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        console.log("🚀 Mengeksekusi SQL...");
        await client.query(sqlContent);

        console.log("✅ Data berhasil di-import dari 'ecuti_db_pg.sql'!");
        console.log("🎉 SETUP SELESAI! Silakan jalankan 'npm run server'.");

    } catch (err) {
        console.error("❌ Terjadi Kesalahan:", err);
    } finally {
        if (client) await client.end();
    }
};

setupDatabase();