# Tentang Aplikasi E-Cuti

Dokumen ini menjelaskan gambaran umum fitur-fitur yang terdapat di dalam aplikasi E-Cuti beserta kelebihan dan kekurangannya.

## Deskripsi Umum
Aplikasi E-Cuti adalah portal manajemen ketidakhadiran (cuti) karyawan yang dikembangkan untuk menyederhanakan proses birokrasi permohonan cuti. Sistem ini memindahkan proses manual berbasis kertas atau chat menjadi tersistemasi penuh, memiliki rekam jejak, dan notifikasi yang real-time.

## Fitur-Fitur Aplikasi
1. **Dashboard Karyawan:** Menampilkan ringkasan sisa saldo cuti dan status pengajuan terkini.
2. **Form Pengajuan Cuti:** Form dinamis yang menghitung total hari pengajuan.
3. **Sistem Persetujuan Berjenjang:** Alur approval 3 lapis, mulai dari Team Leader (TL) -> Supervisor (SPV) -> Manager (MGR).
4. **Manajemen Pengguna (Admin Panel):** CRUD lengkap pengguna dan manajemen struktur atasan.
5. **Manajemen Saldo:** Kemampuan menambah/mengurangi saldo cuti oleh Admin beserta unggahan lampiran bukti, dan riwayat mutasi saldo (`balance_history`).
6. **Notifikasi Email:** Pengingat dan konfirmasi yang dikirimkan langsung ke email *approver* dan karyawan menggunakan SMTP.
7. **Pagination dan Pencarian:** Daftar cuti yang mudah dieksplorasi.

## Kelebihan Aplikasi
1. **Birokrasi Terstruktur:** Memastikan tidak ada pengajuan cuti yang melewati struktur organisasi yang ada.
2. **Transparansi:** Status cuti dan sisa saldo cuti dapat dipantau langsung oleh karyawan tanpa harus bertanya ke HR.
3. **Notifikasi Cepat:** Penggunaan Nodemailer mempercepat tanggapan dari atasan karena email langsung masuk saat cuti diajukan.
4. **UI/UX Modern:** Dibangun menggunakan React dan Tailwind CSS sehingga tampilannya bersih, responsif, dan mudah dipahami (*user-friendly*).
5. **Integritas Transaksi:** Menggunakan Query Transaksi (BEGIN/COMMIT) di level database memastikan tidak ada kesalahan pemotongan saldo.

## Kekurangan Aplikasi
1. **Keamanan Autentikasi:** Saat ini aplikasi hanya memvalidasi kombinasi email dan plain-text password di database tanpa enkripsi atau proses *hashing*, serta kurang implementasi proteksi JWT/Session berbasis Token pada *backend API*.
2. **Penyimpanan Berkas (Storage):** Bukti cuti (file) masih disimpan di *local file system* server (`Bukti Penambahan Cuti`), yang bisa membebani server jika data membengkak, dan sulit untuk di-scale horizontal.
3. **Tidak Menghitung Hari Libur:** Sistem belum memiliki integrasi kalender hari libur nasional atau *weekend*, sehingga hari libur mungkin saja terhitung sebagai hari cuti jika berada dalam rentang tanggal.
4. **Responsivitas Email Tersendat:** Pengiriman email dilakukan secara sekuensial (blocking) dalam request, yang dapat memperlambat response HTTP saat cuti diajukan jika server SMTP bermasalah.
