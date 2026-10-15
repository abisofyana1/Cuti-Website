import express from 'express';
import pg from 'pg';
import cors from 'cors';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const app = express();
// Menggunakan port 3002 untuk server backend
const PORT = 3002;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'Bukti Penambahan Cuti')));

// Database Connection Config (PostgreSQL)
// IMPORTANT: Please update these credentials to match your local PostgreSQL setup.
const dbConfig = {
    user: 'postgres',        // Default user
    host: 'localhost',
    database: 'ecuti_db',    // Ensure this database is created in Postgres
    password: 'admin',       // Password updated based on previous user input
    port: 5432,              // Default Postgres port
};

const pool = new Pool(dbConfig);

// Initialize Tables
pool.query(`
  CREATE TABLE IF NOT EXISTS balance_history (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    proof_file VARCHAR(255),
    admin_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error("Failed to create balance_history table", err));

pool.query(`
  CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
  );

`).catch(err => console.error("Failed to create services table", err));

pool.query(`
  CREATE TABLE IF NOT EXISTS holidays (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL
  );
`).catch(err => console.error("Failed to create holidays table", err));

// --- AUTO MIGRATIONS ---
const runMigrations = async () => {
    try {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' and column_name='hq';
        `);
        if (res.rowCount === 0) {
            console.log("[Migration] Adding 'hq' column to 'users' table...");
            await pool.query('ALTER TABLE users ADD COLUMN hq VARCHAR(100)');
            console.log("[Migration] 'hq' column added successfully.");
        }
    } catch (err) {
        console.error("Migration failed:", err);
    }
};

runMigrations();

// --- CONFIGURATION ---
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

// --- EMAIL CONFIGURATION (NODEMAILER) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'email_notifikasi_anda@gmail.com',
        pass: 'password_app_anda'
    }
});

// Helper Function: Send Email
const sendEmailNotification = async (to, subject, htmlContent) => {
    try {
        console.log(`[Email System] Mencoba mengirim ke: ${to}`);

        if (!to || to.includes('@ecuti.com') || to === '') {
            console.log(`[Email System] ⚠️ SKIP SMTP: Email tujuan '${to}' adalah domain mock/dummy atau kosong.`);
            // console.log(`[Email System] 📧 Subject: ${subject}`);
            return;
        }

        const info = await transporter.sendMail({
            from: '"E-Cuti" <no-reply@ecuti.com>',
            to: to,
            subject: subject,
            html: htmlContent
        });
        console.log("[Email System] ✅ Email terkirim via SMTP ID: %s", info.messageId);
    } catch (error) {
        console.error("[Email System] ❌ Gagal mengirim email:", error);
    }
};

// --- EMAIL QUEUE (Background Process) ---
const emailQueue = [];

const processEmailQueue = async () => {
    if (emailQueue.length > 0) {
        const { to, subject, htmlContent } = emailQueue.shift();
        await sendEmailNotification(to, subject, htmlContent);
    }
};

// Run the queue processor every 3 seconds
setInterval(processEmailQueue, 3000);

// --- FILE UPLOAD CONFIGURATION ---
const proofDir = path.join(__dirname, 'Bukti Penambahan Cuti');
if (!fs.existsSync(proofDir)) {
    fs.mkdirSync(proofDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, proofDir);
    },
    filename: (req, file, cb) => {
        // Sanitize filename to avoid issues
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    }
});

const upload = multer({ storage: storage });

// --- ROUTES ---

// === HOLIDAYS ENDPOINTS ===

// GET ALL HOLIDAYS
app.get('/api/holidays', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM holidays ORDER BY date ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// ADD HOLIDAY
app.post('/api/holidays', async (req, res) => {
    const { date, description } = req.body;
    if (!date || !description) return res.status(400).json({ error: 'Date and description required' });
    try {
        const result = await pool.query(
            'INSERT INTO holidays (date, description) VALUES ($1, $2) RETURNING *',
            [date, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        if (err.code === '23505') { // Unique constraint violation
            return res.status(400).json({ error: 'Holiday date already exists' });
        }
        res.status(500).json({ error: 'Database error' });
    }
});

// DELETE HOLIDAY
app.delete('/api/holidays/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM holidays WHERE id = $1', [id]);
        res.json({ message: 'Holiday deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
});

// === END HOLIDAYS ===

// 0. Upload Proof Endpoint
app.post('/api/upload-proof', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        console.log(`[Upload System] File saved at: ${req.file.path}`);
        res.json({
            message: "File uploaded successfully",
            filename: req.file.filename,
            path: req.file.path
        });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ message: "File upload failed" });
    }
});

// 1. Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE (LOWER(email) = LOWER($1) OR LOWER(hq) = LOWER($1)) AND password = $2',
            [email, password]
        );

        if (rows.length > 0) {
            const u = rows[0];
            const user = {
                email: u.email,
                name: u.name,
                role: u.role,
                balance: u.balance,
                position: u.position,
                service: u.service,
                vendor: u.vendor,
                hq: u.hq,
                tlEmail: u.tl_email,
                spvEmail: u.spv_email,
                mgrEmail: u.mgr_email
            };

            res.json({
                ...user,
                config: {
                    sessionTimeout: SESSION_TIMEOUT_MS
                }
            });
        } else {
            res.status(401).json({ message: "Email atau password salah" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Database error" });
    }
});

// --- SERVICES API ---
app.get('/api/services', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM services ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching services", err);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

app.post('/api/services', async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Service name is required' });
    try {
        const result = await pool.query('INSERT INTO services (name) VALUES ($1) RETURNING *', [name]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("Error adding service", err);
        if (err.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Service name already exists' });
        }
        res.status(500).json({ error: 'Failed to add service' });
    }
});

app.put('/api/services/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Service name is required' });
    try {
        const result = await pool.query('UPDATE services SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating service", err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Service name already exists' });
        }
        res.status(500).json({ error: 'Failed to update service' });
    }
});

app.delete('/api/services/:id', async (req, res) => {
    try {
        const result = await pool.query('DELETE FROM services WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Service not found' });
        res.json({ message: 'Service deleted successfully' });
    } catch (err) {
        console.error("Error deleting service", err);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

// --- USER MANAGEMENT ---
// 2. Get All Users
app.get('/api/users', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM users');

        const users = rows.map(u => ({
            email: u.email,
            name: u.name,
            role: u.role,
            balance: u.balance,
            position: u.position,
            service: u.service,
            vendor: u.vendor,
            hq: u.hq,
            tlEmail: u.tl_email,
            spvEmail: u.spv_email,
            mgrEmail: u.mgr_email
        }));
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Create User
app.post('/api/users', async (req, res) => {
    const user = req.body;
    try {
        const password = user.password || '123';

        const query = `
            INSERT INTO users 
            (email, password, name, role, balance, position, vendor, hq, service, tl_email, spv_email, mgr_email) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `;

        await pool.query(query, [
            user.email, password, user.name, user.role,
            user.balance || 12, user.position, user.vendor, user.hq, user.service,
            user.tlEmail || null, user.spvEmail || null, user.mgrEmail || null
        ]);

        res.status(201).json({ message: "User created successfully" });
    } catch (error) {
        console.error("Create User Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3.5 Update User
app.put('/api/users/:email', async (req, res) => {
    const { email } = req.params;
    const user = req.body;
    console.log('Update payload for', email, ':', JSON.stringify(user, null, 2));
    try {
        let query = '';
        let params = [];

        if (user.password && user.password.trim() !== '') {
            query = `
                UPDATE users SET 
                password = $1, name = $2, role = $3, balance = $4, position = $5, 
                vendor = $6, hq = $7, service = $8, tl_email = $9, spv_email = $10, mgr_email = $11
                WHERE email = $12
            `;
            params = [
                user.password, user.name, user.role, user.balance, user.position,
                user.vendor, user.hq, user.service, user.tlEmail || null, user.spvEmail || null, user.mgrEmail || null,
                email
            ];
        } else {
            query = `
                UPDATE users SET 
                name = $1, role = $2, balance = $3, position = $4, 
                vendor = $5, hq = $6, service = $7, tl_email = $8, spv_email = $9, mgr_email = $10
                WHERE email = $11
            `;
            params = [
                user.name, user.role, user.balance, user.position,
                user.vendor, user.hq, user.service, user.tlEmail || null, user.spvEmail || null, user.mgrEmail || null,
                email
            ];
        }

        await pool.query(query, params);

        // --- BALANCE HISTORY LOGIC ---
        // Expecting user.balanceHistory object from frontend if adding leave
        if (user.balanceHistory) {
            const { amount, description, proofFile, adminName } = user.balanceHistory;
            await pool.query(
                `INSERT INTO balance_history (user_email, amount, description, proof_file, admin_name) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [email, amount, description, proofFile, adminName]
            );
            console.log(`[Balance History] Recorded ${amount} days for ${email}`);
        }

        res.json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Update User Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 3.6 Get Balance History
app.get('/api/balance-history/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { rows } = await pool.query(
            'SELECT * FROM balance_history WHERE user_email = $1 ORDER BY created_at DESC',
            [email]
        );
        const history = rows.map(r => ({
            id: r.id,
            userEmail: r.user_email,
            amount: r.amount,
            description: r.description,
            proofFile: r.proof_file,
            adminName: r.admin_name,
            createdAt: r.created_at
        }));
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Get Leaves (Supports Pagination & Filtering)
app.get('/api/leaves', async (req, res) => {
    try {
        const { page, limit, search, approver, userEmail } = req.query;

        // --- LEGACY MODE (Return Array) ---
        // If no 'page' param, return all data (old behavior)
        if (!page) {
            const { rows } = await pool.query('SELECT * FROM leave_requests ORDER BY created_at DESC');
            const leaves = rows.map(l => mapLeaveDBToModel(l));
            return res.json(leaves);
        }

        // --- PAGINATION MODE (Return Object) ---
        const pageInt = parseInt(page) || 1;
        const limitInt = parseInt(limit) || 10;
        const offset = (pageInt - 1) * limitInt;

        // Build Dynamic Query
        let whereClauses = [];
        let params = [];
        let paramIndex = 1;

        if (search) {
            whereClauses.push(`(user_name ILIKE $${paramIndex} OR service ILIKE $${paramIndex} OR reason ILIKE $${paramIndex})`);
            params.push(`%${search}%`);
            paramIndex++;
        }

        if (approver) {
            whereClauses.push(`(approver_tl = $${paramIndex} OR approver_spv = $${paramIndex} OR approver_mgr = $${paramIndex})`);
            params.push(approver);
            paramIndex++;
        }

        if (userEmail) {
            whereClauses.push(`user_email = $${paramIndex}`);
            params.push(userEmail);
            paramIndex++;
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Count Total (for Pagination Meta)
        const countQuery = `SELECT COUNT(*) FROM leave_requests ${whereSql}`;
        const countRes = await pool.query(countQuery, params);
        const totalCount = parseInt(countRes.rows[0].count);

        // Fetch Paged Data
        const dataQuery = `
            SELECT * FROM leave_requests 
            ${whereSql} 
            ORDER BY created_at DESC 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;
        // Add limit and offset to params
        params.push(limitInt, offset);

        const { rows } = await pool.query(dataQuery, params);
        const leaves = rows.map(l => mapLeaveDBToModel(l));

        res.json({
            data: leaves,
            pagination: {
                total: totalCount,
                page: pageInt,
                limit: limitInt,
                totalPages: Math.ceil(totalCount / limitInt)
            }
        });

    } catch (error) {
        console.error("Get Leaves Error:", error);
        res.status(500).json({ error: error.message });
    }
});

function mapLeaveDBToModel(l) {
    let parsedHistory = l.history || [];
    if (typeof l.history === 'string') {
        try {
            parsedHistory = JSON.parse(l.history);
        } catch (e) {
            // console.error("Failed to parse history", e);
            parsedHistory = [];
        }
    }

    let createdAtIso = null;
    if (l.created_at) {
        createdAtIso = new Date(l.created_at).toISOString();
    } else {
        const submitLog = Array.isArray(parsedHistory) ? parsedHistory.find(h => h.action === 'SUBMIT') : null;
        if (submitLog && submitLog.timestamp) {
            createdAtIso = submitLog.timestamp;
        }
    }

    return {
        id: l.id,
        userEmail: l.user_email,
        userName: l.user_name,
        service: l.service,
        startDate: l.start_date,
        endDate: l.end_date,
        totalDays: l.total_days,
        reason: l.reason,
        status: l.status,
        currentPosition: l.current_position,
        approverTL: l.approver_tl,
        approverSPV: l.approver_spv,
        approverMGR: l.approver_mgr,
        createdAt: createdAtIso,
        history: Array.isArray(parsedHistory) ? parsedHistory : []
    };
}

// 4.5 Get Team Leaves
app.get('/api/leaves/team', async (req, res) => {
    try {
        const { service, status } = req.query;
        if (!service) {
            return res.status(400).json({ error: "Service is required" });
        }
        
        let queryStr = "SELECT * FROM leave_requests WHERE service = $1 AND status = 'APPROVED' ORDER BY start_date DESC LIMIT 50";
        if (status === 'all_active') {
            queryStr = "SELECT * FROM leave_requests WHERE service = $1 AND status IN ('APPROVED', 'PENDING') ORDER BY start_date DESC LIMIT 50";
        }
        
        const { rows } = await pool.query(queryStr, [service]);
        
        const leaves = rows.map(l => mapLeaveDBToModel(l));
        res.json(leaves);
    } catch (error) {
        console.error("Get Team Leaves Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Create Leave (SUBMIT)
app.post('/api/leaves', async (req, res) => {
    const leave = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const createdDate = leave.createdAt ? new Date(leave.createdAt) : new Date();

        const query = `
            INSERT INTO leave_requests 
            (id, user_email, user_name, service, start_date, end_date, total_days, reason, status, current_position, approver_tl, approver_spv, approver_mgr, history, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        `;

        await client.query(query, [
            leave.id, leave.userEmail, leave.userName, leave.service,
            leave.startDate, leave.endDate, leave.totalDays, leave.reason,
            leave.status, leave.currentPosition,
            leave.approverTL, leave.approverSPV, leave.approverMGR,
            JSON.stringify(leave.history),
            createdDate
        ]);

        await client.query('COMMIT');

        // --- EMAIL LOGIC (SUBMIT) ---
        let approverEmail = '';
        if (leave.currentPosition === 'TL') approverEmail = leave.approverTL;
        else if (leave.currentPosition === 'SPV') approverEmail = leave.approverSPV;
        else if (leave.currentPosition === 'MGR') approverEmail = leave.approverMGR;

        const startDateFormatted = new Date(leave.startDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const endDateFormatted = new Date(leave.endDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

        if (approverEmail) {
            const subject = `[E-Cuti] Permohonan Cuti Baru: ${leave.userName}`;
            const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h3 style="color: #2563eb;">Permohonan Cuti Baru</h3>
                    <p>Halo,</p>
                    <p><strong>${leave.userName}</strong> (${leave.service}) telah mengajukan permohonan cuti.</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0; border-radius: 4px;">
                        <p style="margin: 5px 0;"><strong>Tanggal:</strong> ${startDateFormatted} s/d ${endDateFormatted}</p>
                        <p style="margin: 5px 0;"><strong>Durasi:</strong> ${leave.totalDays} Hari</p>
                        <p style="margin: 5px 0;"><strong>Alasan:</strong> "${leave.reason}"</p>
                    </div>
                    <p>Silakan login ke aplikasi E-Cuti (Menu Persetujuan) untuk meninjau permohonan ini.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <small style="color: #888;">Email ini dikirim otomatis oleh sistem E-Cuti.</small>
                </div>
            `;
            emailQueue.push({ to: approverEmail, subject, htmlContent: html });
        }

        res.status(201).json({ message: "Success" });
    } catch (error) {
        console.error(error);
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// 6. Update Leave (APPROVE/REJECT)
app.put('/api/leaves/:id', async (req, res) => {
    const { id } = req.params;
    const { status, currentPosition, history } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query('SELECT * FROM leave_requests WHERE id = $1', [id]);

        if (rows.length === 0) {
            throw new Error("Data cuti tidak ditemukan");
        }

        const existingLeave = rows[0];

        await client.query(
            'UPDATE leave_requests SET status = $1, current_position = $2, history = $3 WHERE id = $4',
            [status, currentPosition, JSON.stringify(history), id]
        );

        if (status === 'APPROVED' && existingLeave.status !== 'APPROVED') {
            await client.query(
                'UPDATE users SET balance = balance - $1 WHERE email = $2',
                [existingLeave.total_days, existingLeave.user_email]
            );
        }

        await client.query('COMMIT');

        // --- EMAIL LOGIC (UPDATE) ---
        let startDateFormatted = existingLeave.start_date;
        try {
            startDateFormatted = new Date(existingLeave.start_date).toLocaleDateString('id-ID', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
        } catch (err) {
            console.error("Error formatting date for email:", err);
        }

        if (status === 'APPROVED' || status === 'REJECTED') {
            const subject = `[E-Cuti] Status Pengajuan Cuti: ${status}`;
            const color = status === 'APPROVED' ? '#16a34a' : '#dc2626';
            const statusText = status === 'APPROVED' ? 'DISETUJUI' : 'DITOLAK';

            const html = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h3 style="color: #333;">Status Cuti Diperbarui</h3>
                    <p>Halo <strong>${existingLeave.user_name}</strong>,</p>
                    <p>Pengajuan cuti Anda untuk tanggal <strong>${startDateFormatted}</strong> telah:</p>
                    <div style="text-align: center; margin: 20px 0;">
                        <span style="background-color: ${color}; color: white; padding: 10px 20px; font-weight: bold; border-radius: 50px; font-size: 16px;">
                            ${statusText}
                        </span>
                    </div>
                    <p><strong>Catatan:</strong> <em>${existingLeave.reason}</em></p>
                    <p>Status terbaru sudah diperbarui di dashboard aplikasi Anda.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <small style="color: #888;">Email ini dikirim otomatis oleh sistem E-Cuti.</small>
                </div>
            `;

            console.log(`[Email System] Menambahkan notifikasi status ke antrean email untuk: ${existingLeave.user_email}`);
            emailQueue.push({ to: existingLeave.user_email, subject, htmlContent: html });
        }
        else if (status === 'PENDING' && currentPosition !== existingLeave.current_position) {
            let nextApproverEmail = '';
            let nextRole = currentPosition;

            if (currentPosition === 'SPV') nextApproverEmail = existingLeave.approver_spv;
            else if (currentPosition === 'MGR') nextApproverEmail = existingLeave.approver_mgr;

            if (nextApproverEmail) {
                const subject = `[E-Cuti] Butuh Persetujuan: Cuti ${existingLeave.user_name}`;
                const html = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h3 style="color: #2563eb;">Permohonan Cuti Masuk</h3>
                        <p>Halo <strong>${nextRole}</strong>,</p>
                        <p>Pengajuan cuti dari <strong>${existingLeave.user_name}</strong> telah disetujui oleh jenjang sebelumnya.</p>
                        <p>Dokumen ini sekarang menunggu persetujuan Anda.</p>
                        <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #3b82f6; margin: 15px 0;">
                            <p style="margin: 5px 0;"><strong>Tanggal Cuti:</strong> ${startDateFormatted}</p>
                            <p style="margin: 5px 0;"><strong>Durasi:</strong> ${existingLeave.total_days} Hari</p>
                        </div>
                        <p>Silakan login ke aplikasi E-Cuti untuk meninjau.</p>
                    </div>
                `;
                emailQueue.push({ to: nextApproverEmail, subject, htmlContent: html });
            }
        }

        res.json({ message: "Updated" });
    } catch (error) {
        console.error("Error updating leave:", error);
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// 7. Delete User
app.delete('/api/users/:email', async (req, res) => {
    const { email } = req.params;
    try {
        await pool.query('DELETE FROM leave_requests WHERE user_email = $1', [email]);
        await pool.query('DELETE FROM users WHERE email = $1', [email]);
        res.json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
