# Alur Flow Chart - Aplikasi E-Cuti

Dokumen ini berisi representasi Flow Chart dari berbagai proses utama dalam Aplikasi E-Cuti menggunakan notasi Mermaid. Anda dapat melihat visualisasinya di markdown viewer yang mendukung Mermaid.

## 1. Flow Chart Pengajuan Cuti (Pegawai)

Flow chart ini menggambarkan alur saat pegawai mengajukan cuti hingga statusnya berubah menjadi menunggu persetujuan.

```mermaid
graph TD
    A[Mulai] --> B[Login sebagai Pegawai]
    B --> C[Buka Menu Pengajuan Cuti]
    C --> D[Cek Sisa Kuota Cuti]
    D --> E{Apakah Kuota Cuti > 0?}
    E -- Tidak --> F[Tampilkan Pesan Error: Kuota Habis]
    F --> G[Selesai]
    E -- Ya --> H[Isi Form Pengajuan Cuti]
    H --> I[Pilih Tanggal, Jenis Cuti, & Alasan]
    I --> J[Submit Pengajuan]
    J --> K[Simpan Data ke Database]
    K --> L[Status: Menunggu Persetujuan Atasan]
    L --> G
```

## 2. Flow Chart Persetujuan Cuti (Atasan)

Flow chart ini menggambarkan proses saat atasan meninjau dan memberikan keputusan terhadap pengajuan cuti pegawai.

```mermaid
graph TD
    A[Mulai] --> B[Login sebagai Atasan]
    B --> C[Buka Menu Approval Cuti]
    C --> D[Lihat Daftar Cuti 'Menunggu Persetujuan']
    D --> E[Pilih Pengajuan Cuti]
    E --> F[Review Detail Pengajuan]
    F --> G{Keputusan Atasan?}
    G -- Tolak --> H[Isi Alasan Penolakan]
    H --> I[Update Status: Ditolak]
    I --> M[Kirim Notifikasi Penolakan]
    G -- Setuju --> J[Update Status: Disetujui]
    J --> K[Kurangi Kuota Cuti Pegawai]
    K --> L[Kirim Notifikasi Persetujuan]
    L --> M
    M --> N[Selesai]
```

## 3. Flow Chart Kelola Data Pegawai (Admin/HRD)

Flow chart ini menggambarkan alur admin dalam menambah atau mengelola data pegawai baru.

```mermaid
graph TD
    A[Mulai] --> B[Login sebagai Admin/HRD]
    B --> C[Buka Menu Master Data Pegawai]
    C --> D[Pilih Aksi Tambah Pegawai]
    D --> E[Isi Form Data Diri Pegawai]
    E --> F[Set Jatah Kuota Cuti Awal]
    F --> G[Simpan Data]
    G --> H[Simpan ke Database]
    H --> I[Generate Akun Pegawai]
    I --> J[Selesai]
```

---
*Catatan: Anda dapat menggunakan ekstensi Markdown Preview di VS Code (atau platform lain) yang mendukung Mermaid untuk melihat grafik secara visual.*
