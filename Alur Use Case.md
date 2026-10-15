# Alur Use Case - Aplikasi E-Cuti

Dokumen ini berisi daftar dan alur Use Case untuk Aplikasi E-Cuti.

## Daftar Aktor
1. **Pegawai (Karyawan)**: Mengajukan cuti, melihat sisa cuti, dan melihat riwayat cuti.
2. **Atasan (Manajer/Supervisor)**: Menyetujui atau menolak pengajuan cuti bawahan.
3. **Admin/HRD**: Mengelola data pegawai, mengatur jatah cuti, dan melihat laporan keseluruhan.

## Daftar Use Case

### 1. Login
*   **Aktor:** Semua Aktor (Pegawai, Atasan, Admin)
*   **Deskripsi:** Aktor masuk ke dalam sistem menggunakan kredensial (username/email dan password).
*   **Alur Utama:**
    1. Aktor membuka halaman login.
    2. Aktor memasukkan username/email dan password.
    3. Sistem memvalidasi kredensial.
    4. Sistem mengarahkan aktor ke dashboard sesuai dengan perannya.

### 2. Mengajukan Cuti (Pengajuan Cuti)
*   **Aktor:** Pegawai
*   **Deskripsi:** Pegawai membuat permohonan cuti baru.
*   **Alur Utama:**
    1. Pegawai memilih menu "Pengajuan Cuti".
    2. Sistem menampilkan sisa cuti pegawai.
    3. Pegawai mengisi form pengajuan cuti (jenis cuti, tanggal mulai, tanggal selesai, alasan).
    4. Pegawai menyimpan pengajuan.
    5. Sistem mengubah status pengajuan menjadi "Menunggu Persetujuan".

### 3. Persetujuan Cuti (Approval Cuti)
*   **Aktor:** Atasan
*   **Deskripsi:** Atasan memberikan persetujuan atau penolakan terhadap pengajuan cuti pegawai.
*   **Alur Utama:**
    1. Atasan melihat daftar pengajuan cuti bawahan yang berstatus "Menunggu Persetujuan".
    2. Atasan memilih salah satu pengajuan untuk melihat detailnya.
    3. Atasan memilih aksi "Setujui" atau "Tolak" (beserta alasan penolakan jika ditolak).
    4. Sistem memperbarui status pengajuan cuti.
    5. Jika disetujui, sistem mengurangi jatah/sisa cuti pegawai.

### 4. Melihat Riwayat Cuti
*   **Aktor:** Pegawai
*   **Deskripsi:** Pegawai melihat riwayat pengajuan cuti yang pernah dibuat beserta statusnya.
*   **Alur Utama:**
    1. Pegawai memilih menu "Riwayat Cuti".
    2. Sistem menampilkan daftar riwayat pengajuan cuti pegawai.

### 5. Kelola Data Pegawai
*   **Aktor:** Admin/HRD
*   **Deskripsi:** Admin dapat menambah, mengubah, atau menghapus data pegawai.
*   **Alur Utama:**
    1. Admin memilih menu "Master Data Pegawai".
    2. Sistem menampilkan daftar pegawai.
    3. Admin melakukan aksi (Tambah/Ubah/Hapus).
    4. Sistem menyimpan perubahan data.

### 6. Kelola Kuota Cuti
*   **Aktor:** Admin/HRD
*   **Deskripsi:** Admin mengatur jatah tahunan cuti untuk masing-masing pegawai atau secara massal.
*   **Alur Utama:**
    1. Admin memilih menu "Pengaturan Kuota Cuti".
    2. Admin memperbarui kuota cuti pegawai.
    3. Sistem menyimpan data kuota terbaru.

---
*Catatan: Template ini dapat disesuaikan dan dikembangkan lebih lanjut sesuai dengan kebutuhan detail dari aplikasi E-Cuti yang sedang dibangun.*
