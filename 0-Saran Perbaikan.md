# Saran dan Perbaikan Aplikasi E-Cuti

Berdasarkan kajian fitur dan struktur aplikasi saat ini, berikut adalah beberapa saran perbaikan dan penambahan fitur (Enhancement) yang dapat dilakukan di masa mendatang karena belum diimplementasikan di versi sekarang:

## 1. Peningkatan Keamanan (Security)
* **Enkripsi Kata Sandi:** Saat ini sandi tersimpan sebagai teks biasa (*plain text*). Diperlukan integrasi library seperti `bcrypt` untuk melakukan *hashing* terhadap *password* pengguna sebelum disimpan di database.
* **Autentikasi Berbasis Token:** Aplikasi saat ini hanya merespons profil saat login. Implementasi `JSON Web Token (JWT)` sangat disarankan untuk mengamankan API sehingga *endpoint* tidak bisa diakses tanpa *session* yang valid.
* **Validasi Tipe File Dokumen:** Saat ini pengunggahan bukti (`multer`) hanya me-*rename* file. Perlu ada filter untuk hanya memperbolehkan ekstensi gambar/dokumen tertentu (PDF, JPG, PNG) dan membatasi ukuran file (*file size limit*).

## 2. Fitur Fungsional untuk Karyawan
* **Pembatalan Cuti (Cancel Request):** Karyawan sebaiknya memiliki tombol untuk membatalkan pengajuan cuti *selama* statusnya masih `PENDING`.
* **Lampiran Dokumen (Attachment):** Karyawan membutuhkan kemampuan untuk mengunggah dokumen langsung saat pengajuan cuti. Fitur ini sangat penting terutama untuk **Cuti Sakit** (melampirkan Surat Keterangan Dokter).
* **Integrasi Kalender / Hari Libur Nasional:** Sistem penghitungan durasi cuti sebaiknya dapat melewati hari Sabtu, Minggu, dan Hari Libur Nasional (Public Holiday API) sehingga hari-hari tersebut tidak mengurangi saldo cuti karyawan.



## 4. Skalabilitas & Arsitektur
* **Penggunaan ORM:** Memindahkan *raw query* (seperti `pool.query('INSERT INTO...')`) menjadi penggunaan ORM (*Object Relational Mapping*) seperti **Prisma** atau **Sequelize** untuk mempermudah migrasi database dan *maintenance* struktur.
* **Cloud Storage untuk Berkas:** Menyimpan lampiran bukti atau profil tidak lagi di memori lokal (`/Bukti Penambahan Cuti`), melainkan dihubungkan dengan layanan *Object Storage* seperti AWS S3 atau Google Cloud Storage.
