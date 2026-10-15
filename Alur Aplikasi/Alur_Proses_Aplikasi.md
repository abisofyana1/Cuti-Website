# Alur Proses Aplikasi E-Cuti

Dokumen ini menjelaskan alur proses aplikasi E-Cuti secara detail berdasarkan rancangan antarmuka (UI) dari gambar 6 hingga 12.

## 1. Proses Autentikasi (Login)
**Referensi:** Gambar 6 - Halaman Login
* **Aktor:** Semua Role (User, TL, SPV, MGR, dll.)
* **Alur:** 
  1. Pengguna membuka halaman login aplikasi.
  2. Sistem menampilkan form login.
  3. Pengguna memasukkan kredensial berupa **Email** dan **Password**.
  4. Pengguna menekan tombol **"MASUK"**.
  5. Sistem memvalidasi kredensial. Jika berhasil, pengguna akan diarahkan ke halaman Dashboard sesuai dengan _role_ masing-masing.

## 2. Alur Pengguna Biasa (Role User)

### A. Melihat Ringkasan Data Cuti (Dashboard)
**Referensi:** Gambar 7 - Halaman Dashboard Role User
* **Alur:**
  1. Setelah berhasil login, user akan masuk ke halaman Dashboard.
  2. Sistem menampilkan kartu informasi ringkasan cuti:
     * **Sisa Cuti:** Jumlah hari cuti yang masih tersedia.
     * **Masuk Cuti Bersama:** Jumlah cuti bersama pada tahun berjalan.
     * **Menunggu:** Jumlah permohonan cuti yang sedang menunggu persetujuan (aktif).
     * **Disetujui:** Total permohonan cuti yang telah disetujui.
     * **Ditolak:** Total permohonan cuti yang ditolak.
  3. Sistem menampilkan tabel **Riwayat Pengajuan Terakhir**, yang memuat Tanggal Cuti, Alasan, Durasi, Posisi Saat Ini (Approval di tahap mana), dan Status (misal: APPROVED).
  4. Sistem menampilkan Kalender Tim untuk melihat jadwal cuti rekan satu tim.

### B. Mengajukan Cuti Baru
**Referensi:** Gambar 8 - Halaman Pengajuan Cuti Role User
* **Alur:**
  1. User memilih menu **"Ajukan Cuti"** dari navigasi sebelah kiri.
  2. Sistem menampilkan modal/popup **"Form Cuti"**.
  3. Di dalam form, sistem menampilkan Sisa Cuti saat ini dan secara otomatis menentukan struktur *Approval* (TL, SPV, MGR) berdasarkan Layanan/Unit Kerja pengguna (misal: CX EXCELLENCE).
  4. User mengisi rentang waktu cuti: **Mulai** (Tanggal) dan **Selesai** (Tanggal). Sistem akan otomatis menghitung **Durasi** (hari).
  5. User mengisi **Alasan Cuti** (contoh: Acara keluarga, sakit, dll.).
  6. User menekan tombol **"Kirim Pengajuan"**.
  7. Status pengajuan menjadi "Menunggu" dan akan diteruskan ke atasan terkait sesuai hierarki approval.

## 3. Alur Atasan (Role TL, SPV, MGR)

Atasan memiliki fitur yang sama dengan User (seperti melihat Dashboard sendiri dan Mengajukan Cuti), namun memiliki tambahan menu **MANAJEMEN** untuk mengelola timnya.

### A. Melihat Dashboard Atasan
**Referensi:** Gambar 9 - Halaman Dashboard Role TL, SPV, MGR
* **Alur:**
  1. TL/SPV/MGR masuk ke Dashboard. Tampilannya serupa dengan dashboard User (melihat sisa cuti pribadi).
  2. Perbedaan utamanya ada pada panel menu sebelah kiri, di mana terdapat menu tambahan di bawah kategori **MANAJEMEN**, yaitu:
     * **Riwayat Team**
     * **Persetujuan** (terdapat badge notifikasi jika ada pengajuan baru).

### B. Atasan Mengajukan Cuti
**Referensi:** Gambar 10 - Halaman Ajukan Cuti Role TL, SPV
* **Alur:**
  1. Sama seperti User biasa, TL/SPV juga dapat mengajukan cuti melalui menu **"Ajukan Cuti"**.
  2. Sistem akan menyesuaikan jalur *Approval* berdasarkan role atasan tersebut (misalnya, untuk SPV, approval mungkin langsung ke MGR tanpa melewati TL).

### C. Memantau Riwayat Cuti Tim
**Referensi:** Gambar 11 - Halaman Riwayat Team Role TL, SPV, MGR
* **Alur:**
  1. Atasan memilih menu **"Riwayat Team"**.
  2. Sistem menampilkan daftar seluruh pengajuan cuti dari anggota tim (Riwayat Tim & Approval).
  3. Informasi yang ditampilkan meliputi: Nama Karyawan, Tanggal & Alasan Cuti, Durasi, Status Akhir (misal: Disetujui/Ditolak), Posisi Saat Ini (Checklist approval pada TL/SPV/MGR), dan Dokumen terkait.
  4. Atasan dapat memantau progres persetujuan anggota timnya dari halaman ini.

### D. Memproses Persetujuan Cuti (Approval)
**Referensi:** Gambar 12 - Halaman Persetujuan Role TL, SPV, MGR
* **Alur:**
  1. Atasan memilih menu **"Persetujuan"**.
  2. Sistem menampilkan daftar pengajuan cuti dari bawahan yang berstatus **"Menunggu Persetujuan"**.
  3. Setiap item menampilkan detail: Nama Karyawan, Durasi, Tanggal Mulai s/d Selesai, dan Alasan Cuti.
  4. Atasan melakukan review dan mengambil tindakan:
     * Menekan tombol **"Setujui"** untuk menyetujui pengajuan. Pengajuan akan lanjut ke tingkat *approval* berikutnya (jika ada) atau selesai/APPROVED.
     * Menekan tombol **"Tolak"** untuk menolak pengajuan. Status pengajuan akan berubah menjadi REJECTED.
  5. Setelah diproses, sistem akan memperbarui status pengajuan dan mengurangi saldo cuti pemohon jika disetujui.
