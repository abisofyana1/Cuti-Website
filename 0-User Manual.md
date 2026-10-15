# User Manual E-Cuti

Dokumen ini panduan penggunaan aplikasi E-Cuti berdasarkan peran pengguna (Role). Aplikasi ini menggunakan alur persetujuan bertingkat (Multi-tier Approval).

## 1. Role: Admin
Admin memiliki kontrol penuh terhadap sistem manajemen pengguna dan konfigurasi dasar.
* **Manajemen Pengguna (User Management):** Admin dapat membuat akun baru, mengedit data pengguna (nama, email, role, vendor, service, posisi), serta mengatur siapa TL, SPV, dan MGR dari pengguna tersebut.
* **Manajemen Saldo Cuti:** Admin dapat menambah atau mengubah kuota cuti tahunan (balance) setiap karyawan. Setiap perubahan saldo akan tercatat di `balance_history` beserta bukti (file) jika ada.
* **Manajemen Layanan (Services):** Admin dapat menambah, mengedit, atau menghapus daftar layanan/departemen.
* **Melihat Riwayat:** Admin dapat melihat riwayat pengajuan cuti seluruh karyawan di sistem tanpa batas.

## 2. Role: TL (Team Leader)
Team Leader adalah tahap persetujuan (approval) pertama.
* **Menerima Pengajuan:** Ketika bawahan (User) mengajukan cuti, TL akan menerima notifikasi email.
* **Persetujuan (Approve/Reject):** Di halaman *Approvals* (Persetujuan), TL dapat melihat detail pengajuan.
  * Jika **Diperbolehkan (Approve):** Status akan berubah ke jenjang berikutnya (SPV) dan email notifikasi diteruskan ke SPV.
  * Jika **Ditolak (Reject):** Pengajuan berhenti, status menjadi ditolak, dan email notifikasi dikirim ke pemohon.
* **Riwayat Tim:** TL dapat melihat pengajuan cuti anggota tim di bawahnya.

## 3. Role: SPV (Supervisor)
Supervisor adalah tahap persetujuan (approval) kedua.
* **Menerima Pengajuan:** SPV hanya akan menerima permintaan cuti yang *sudah disetujui* oleh TL.
* **Persetujuan (Approve/Reject):** Di menu *Approvals*, SPV mengevaluasi permohonan.
  * Jika **Disetujui (Approve):** Status naik ke level Manager (MGR).
  * Jika **Ditolak (Reject):** Pengajuan batal dan notifikasi penolakan dikirim ke pemohon.

## 4. Role: MGR (Manager)
Manager adalah tahap persetujuan akhir (Final Approver).
* **Menerima Pengajuan:** MGR akan meninjau permintaan cuti yang sudah melewati persetujuan TL dan SPV.
* **Persetujuan Akhir:** 
  * Jika **Disetujui (Approve):** Status cuti menjadi `APPROVED` secara final. Saldo (balance) pemohon akan otomatis berkurang sesuai jumlah hari cuti. Email notifikasi persetujuan akhir dikirim ke pemohon.
  * Jika **Ditolak (Reject):** Pengajuan cuti gagal, saldo tidak berkurang. Email notifikasi dikirim.

---
**Catatan untuk User (Pemohon):** 
User dapat login, melihat sisa saldo cuti, mengisi form pengajuan cuti beserta rentang tanggal dan alasan, serta memantau status pengajuannya di Dashboard (menunggu persetujuan TL, SPV, atau MGR).
