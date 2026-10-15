# Kajian Aplikasi E-Cuti

Dokumen ini merupakan kajian arsitektur, teknologi, dan alur sistem dari Aplikasi E-Cuti.

## 1. Arsitektur dan Teknologi (Tech Stack)
Aplikasi E-Cuti dibangun menggunakan arsitektur modern berbasis Client-Server:
* **Frontend:** React.js dengan TypeScript, dibangun menggunakan Vite. Styling UI menggunakan Tailwind CSS yang menghasilkan antarmuka modern dan responsif. State manajemen difasilitasi oleh React Context (misalnya `AuthContext`).
* **Backend:** Node.js dengan framework Express.js. API beroperasi pada port 3002.
* **Database:** PostgreSQL digunakan sebagai relational database. Terdapat koneksi menggunakan library `pg`.
* **Notifikasi:** Nodemailer digunakan untuk mengirim email notifikasi SMTP (menggunakan Gmail).
* **Manajemen File:** Multer digunakan untuk memproses *file upload* saat admin melampirkan bukti penambahan saldo cuti.

## 2. Struktur Database
Terdapat beberapa entitas utama di dalam database (`ecuti_db`):
1. **users:** Menyimpan informasi karyawan seperti email, password, nama, role, jabatan, saldo (balance), dan hierarki atasan (`tl_email`, `spv_email`, `mgr_email`).
2. **leave_requests:** Menyimpan data pengajuan cuti, memuat status persetujuan, posisi saat ini (siapa yang harus menyetujui), rentang waktu, alasan, dan kolom JSON `history` untuk mencatat log persetujuan secara kronologis.
3. **balance_history:** Mencatat riwayat perubahan saldo cuti (penambahan atau pengurangan manual oleh Admin), beserta path lokasi *file proof* (bukti) yang diunggah.
4. **services:** Master data departemen atau layanan kerja karyawan (contoh: CX DIGITAL, CX EXCELLENCE).

## 3. Alur Kerja (Workflow) Inti
Aplikasi E-Cuti menitikberatkan pada mekanisme persetujuan berjenjang:
1. **Pengajuan (Submit):** User mengisi rentang waktu cuti. Sistem backend akan memasukkan data berstatus `PENDING` dengan posisi pertama di TL. Node.js mengirimkan notifikasi Email ke `approver_tl`.
2. **Review:** Data masuk ke halaman Approvals berdasarkan Role yang sedang login.
3. **Persetujuan (Approve/Reject):**
   * Backend meng-update field `current_position` (TL -> SPV -> MGR).
   * Pada saat persetujuan final (oleh MGR), backend menjalankan kueri UPDATE untuk mengurangi field `balance` milik user.
4. **Log Riwayat:** Setiap aksi (SUBMIT, APPROVE, REJECT) dilampirkan dalam objek JSON di dalam kolom `history` di tabel `leave_requests`.

## 4. Analisis Kode (Backend API)
* `server.js` menaungi semua *endpoints* CRUD dasar.
* API Pagination diterapkan pada endpoint GET `/api/leaves` untuk efisiensi transfer data dengan pencarian dan filter *approver*.
* Sistem File Upload disajikan secara lokal (disimpan dalam direktori `Bukti Penambahan Cuti`).
* Keamanan transaksi database pada pengajuan dan persetujuan cuti ditangani menggunakan transaksi SQL dasar (`BEGIN`, `COMMIT`, `ROLLBACK`) untuk memastikan integritas data (contohnya pengurangan saldo cuti hanya jika persetujuan final berhasil di-update).
