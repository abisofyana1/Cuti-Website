import React, { useEffect, useState, useRef } from 'react';
import { apiService } from '../services/api';
import { User, LeaveRequest, Role, Service, Holiday } from '../types';
import { useAuth } from '../context/AuthContext';
import XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Search,
    FolderOpen,
    Eye,
    EyeOff,
    Edit,
    Trash2,
    FileDown,
    UserPlus,
    Save,
    ChevronLeft,
    ChevronRight,
    Download,
    Calendar,
    X,
    FileUp,
    AlertTriangle,
    Lock,
    Ban,
    Upload,
    PlusSquare,
    CheckSquare,
    Loader,
    CheckCircle,
    XCircle,
    Clock, // Added Clock for pending status
    History, // Added History icon
    Settings,
    Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CUSTOM_SIGNATURE_BASE64 } from '../constants'; // Import shared constant

// Prop view diterima dari App.tsx berdasarkan routing
interface AdminPanelProps {
    view?: 'dashboard' | 'add-user' | 'export' | 'import' | 'services' | 'holidays';
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ view = 'dashboard' }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [servicesList, setServicesList] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // State Layanan
    const [newServiceName, setNewServiceName] = useState('');
    const [editServiceObj, setEditServiceObj] = useState<Service | null>(null);

    // State Hari Libur
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [newHolidayDate, setNewHolidayDate] = useState('');
    const [newHolidayDesc, setNewHolidayDesc] = useState('');
    const [isAddHolidayModalOpen, setIsAddHolidayModalOpen] = useState(false);
    const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
    const [deleteHolidayTarget, setDeleteHolidayTarget] = useState<Holiday | null>(null);

    // State untuk Modal & Aksi
    const [selectedUserForDoc, setSelectedUserForDoc] = useState<User | null>(null);
    const [detailUser, setDetailUser] = useState<User | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<User>>({});

    // State khusus Edit Saldo Cuti
    const [isAddingLeave, setIsAddingLeave] = useState(false);
    const [addedLeaveAmount, setAddedLeaveAmount] = useState(0);
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofDesc, setProofDesc] = useState('');
    const [proofEventDate, setProofEventDate] = useState('');

    // State Import
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isImporting, setIsImporting] = useState(false);

    // State Delete Confirmation
    const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
    const [deleteServiceTarget, setDeleteServiceTarget] = useState<Service | null>(null);

    // Alert Modal State
    const [alertModal, setAlertModal] = useState<{
        show: boolean;
        title: string;
        message: string;
        type: 'success' | 'error';
    }>({
        show: false, title: '', message: '', type: 'success'
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Filter & Sort State
    const [sortNameAsc, setSortNameAsc] = useState<boolean | null>(null);
    const [filterService, setFilterService] = useState<string>('All');

    const [newUser, setNewUser] = useState<Partial<User>>({
        email: '', password: '', name: '', role: 'User', balance: 12,
        position: 'ASST ADM (TAD)', vendor: '', hq: '', service: '',
        tlEmail: '', spvEmail: '', mgrEmail: ''
    });
    
    const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, leavesData, servicesData, holidaysData] = await Promise.all([
                apiService.getUsers(),
                apiService.getLeaves(),
                apiService.getServices(),
                apiService.getHolidays()
            ]);
            setUsers(usersData);
            setLeaves(leavesData);
            setServicesList(servicesData);
            setHolidays(holidaysData);
        } catch (error) {
            console.error("Gagal memuat data admin", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCloseModal = () => {
        navigate('/admin');
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await apiService.deleteUser(deleteTarget.email);
            const deletedName = deleteTarget.name;
            setDeleteTarget(null);
            fetchData();
            setAlertModal({
                show: true,
                type: 'success',
                title: 'User Dihapus',
                message: `User ${deletedName} berhasil dihapus dari sistem.`
            });
        } catch (error) {
            setAlertModal({ show: true, title: 'Gagal Menghapus', message: 'Gagal menghapus user', type: 'error' });
        }
    };

    const confirmDeleteService = async () => {
        if (!deleteServiceTarget) return;
        try {
            await apiService.deleteService(deleteServiceTarget.id);
            const deletedName = deleteServiceTarget.name;
            setDeleteServiceTarget(null);
            fetchData();
            setAlertModal({
                show: true,
                title: 'Sukses',
                message: `Layanan ${deletedName} berhasil dihapus.`,
                type: 'success'
            });
        } catch (error: any) {
            setAlertModal({
                show: true,
                title: 'Gagal Menghapus',
                message: error.message || 'Gagal menghapus layanan.',
                type: 'error'
            });
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        let errors: {[key: string]: string} = {};

        if (!newUser.email) errors.email = "Email wajib diisi";
        if (!newUser.password) errors.password = "Password wajib diisi";
        if (!newUser.name) errors.name = "Nama Lengkap wajib diisi";
        if (!newUser.role) errors.role = "Role System wajib diisi";
        if (newUser.balance === undefined || newUser.balance === null || String(newUser.balance) === '') errors.balance = "Sisa Cuti wajib diisi";
        
        if (newUser.role !== 'Admin' && !newUser.tlEmail && !newUser.spvEmail && !newUser.mgrEmail) {
             errors.approver = "Salah satu Kolom atasan (TL, SPV, MGR) wajib diisi!";
        }

        if ((newUser.role === 'User' || newUser.role === 'TL') && !newUser.spvEmail) {
            errors.spvEmail = "Untuk role ini, Supervisor (SPV) wajib dipilih!";
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setFormErrors({});

        try {
            const payload = { ...newUser };
            // Clean up fields based on role
            if (payload.role === 'Admin' || payload.role === 'SPV' || payload.role === 'MGR') {
                payload.vendor = '';
            }
            if (payload.role === 'Admin') {
                payload.service = '';
                payload.balance = 0;
            }

            await apiService.addUser(payload as User);
            setNewUser({
                email: '', password: '', name: '', role: 'User', balance: 12,
                position: 'ASST ADM (TAD)', vendor: '', hq: '', service: 'CX DIGITAL',
                tlEmail: '', spvEmail: '', mgrEmail: ''
            });
            setShowPassword(false);
            fetchData();
            navigate('/admin');

            setTimeout(() => {
                setAlertModal({
                    show: true,
                    type: 'success',
                    title: 'User Ditambahkan',
                    message: 'Data user baru berhasil disimpan ke database.'
                });
            }, 300);
        } catch (error) {
            setAlertModal({ show: true, title: 'Gagal Menambah User', message: 'Gagal menambah user. Pastikan email belum terdaftar.', type: 'error' });
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editUser || !editFormData.email) return;

        // Logic Tambah Cuti & Generate PDF
        let finalBalance = Number(editUser.balance);
        let uploadedProofFilename = '';
        let balanceHistoryRecord = null;

        if (isAddingLeave) {
            if (addedLeaveAmount <= 0) {
                setAlertModal({ show: true, title: 'Input Tidak Valid', message: 'Jumlah penambahan cuti harus lebih dari 0!', type: 'error' });
                return;
            }
            if (!proofDesc.trim()) {
                setAlertModal({ show: true, title: 'Input Tidak Valid', message: 'Keterangan penambahan WAJIB diisi!', type: 'error' });
                return;
            }
            if (!proofEventDate) {
                setAlertModal({ show: true, title: 'Input Tidak Valid', message: 'Tanggal Masuk Cuti Bersama WAJIB diisi!', type: 'error' });
                return;
            }
            if (!proofFile) {
                setAlertModal({
                    show: true,
                    title: 'Data Kurang Lengkap',
                    message: "Karena Anda mencentang 'Tambah Kuota Cuti', Anda WAJIB melampirkan Bukti Gambar!",
                    type: 'error'
                });
                return;
            }

            try {
                // 1. Generate PDF (Client-Side)
                const doc = new jsPDF();

                doc.setFont("helvetica", "bold");
                doc.setFontSize(16);
                doc.text("BUKTI PENAMBAHAN CUTI", 105, 20, { align: 'center' });

                doc.setFontSize(12);
                doc.setFont("helvetica", "normal");
                const now = new Date();
                const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

                // Manual 24-hour format construction to ensure consistency
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const timeStr = `${hours}:${minutes}`;

                // Format: Tanggal: Minggu, 11 Januari 2026, Pukul 14:30 WIB
                doc.text(`Tanggal: ${dateStr}, Pukul ${timeStr} WIB`, 14, 40);
                doc.text(`Karyawan: ${editUser.name} (${editUser.email})`, 14, 50);
                doc.text(`Penambahan: ${addedLeaveAmount} Hari`, 14, 60);
                doc.text(`Admin: ${user?.name || 'Administrator'}`, 14, 70);

                doc.setFont("helvetica", "bold");
                doc.text("Keterangan:", 14, 85);
                doc.setFont("helvetica", "normal");

                // Text wrapping for description
                const splitDesc = doc.splitTextToSize(proofDesc, 180);
                doc.text(splitDesc, 14, 95);

                let nextY = 95 + (splitDesc.length * 7) + 10;

                doc.setFont("helvetica", "bold");
                doc.text("Lampiran Bukti:", 14, nextY);
                nextY += 10;

                // 2. Read Image & Add to PDF
                const readImage = (file: File): Promise<string> => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                };

                const imgData = await readImage(proofFile);

                // Scale image to fit page width (max 180mm)
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = 180;
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                const imgFormat = proofFile.type === 'image/png' ? 'PNG' : 'JPEG';
                doc.addImage(imgData, imgFormat, 14, nextY, pdfWidth, pdfHeight);

                // 3. Convert PDF to Blob -> File
                const pdfBlob = doc.output('blob');

                // 4. Upload PDF
                const formData = new FormData();
                formData.append('file', pdfBlob, `Bukti_Tambah_Cuti_${editUser.name}_${Date.now()}.pdf`);

                const uploadRes = await apiService.uploadProof(formData);
                uploadedProofFilename = uploadRes.filename;
                
                const finalDesc = `[${proofEventDate}] ${proofDesc}`;
                finalBalance += addedLeaveAmount;
                balanceHistoryRecord = {
                    amount: addedLeaveAmount,
                    description: finalDesc,
                    proofFile: uploadedProofFilename,
                    adminName: user?.name || 'Admin System'
                };
                console.log("Bukti PDF berhasil diupload ke server.");

            } catch (err: any) {
                console.error("Gagal memproses bukti PDF:", err);
                setAlertModal({ show: true, title: 'Gagal Memproses PDF', message: `Gagal memproses bukti PDF: ${err.message}`, type: 'error' });
                return; // Stop process if proof fails
            }
        }

        try {
            const payload: any = {
                ...editFormData,
                balance: finalBalance
            };

            // Add balance history if applicable
            if (isAddingLeave && balanceHistoryRecord) {
                payload.balanceHistory = balanceHistoryRecord;
            }

            // Clean up fields based on role
            if (payload.role === 'Admin' || payload.role === 'SPV' || payload.role === 'MGR') {
                payload.vendor = '';
            }
            if (payload.role === 'Admin') {
                payload.service = '';
            }

            await apiService.updateUser(editUser.email, payload);

            // Reset states
            setProofFile(null);
            setProofDesc('');
            setProofEventDate('');
            setAddedLeaveAmount(0);
            setIsAddingLeave(false);
            setEditUser(null);
            setEditFormData({});

            fetchData(); // Keep fetchData for consistency but rely on optimistic UI for speed mostly

            // OPTIMISTIC UI UPDATE: Update local state immediately
            if (editUser) {
                setUsers(prevUsers => prevUsers.map(u =>
                    u.email === editUser.email ? { ...u, ...payload } : u
                ));
            }

            setAlertModal({
                show: true,
                type: 'success',
                title: 'Update Berhasil',
                message: isAddingLeave
                    ? `Data user diperbarui dan Bukti Penambahan Cuti berhasil disimpan.`
                    : 'Data user berhasil diperbarui.'
            });
        } catch (error: any) {
            console.error("Update Error:", error);
            setAlertModal({ show: true, title: 'Gagal Update', message: `Gagal mengupdate user: ${error.message || 'Terjadi kesalahan sistem'}`, type: 'error' });
        }
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            let successCount = 0;
            let invalidFormatCount = 0;
            let duplicateCount = 0;
            let invalidFormatList: string[] = [];
            let duplicateList: string[] = [];

            for (const row of jsonData as any[]) {
                const userPayload: Partial<User> = {
                    email: row['Email'],
                    password: row['Password'] ? String(row['Password']) : '',
                    role: row['Role'],
                    name: row['Nama'],
                    balance: row['Sisa Cuti'] ? Number(row['Sisa Cuti']) : 12,
                    position: row['Jabatan'],
                    service: row['Layanan'],
                    vendor: row['Vendor'] || '',
                    hq: row['HQ'] || '',
                    tlEmail: row['TL'],
                    spvEmail: row['SPV'],
                    mgrEmail: row['MGR']
                };

                const hasBasicFields = userPayload.email && userPayload.password && userPayload.name && userPayload.role && userPayload.balance !== undefined && userPayload.balance !== null;
                const hasApprover = userPayload.role === 'Admin' || userPayload.tlEmail || userPayload.spvEmail || userPayload.mgrEmail;

                if (hasBasicFields && hasApprover) {
                    try {
                        await apiService.addUser(userPayload as User);
                        successCount++;
                    } catch (err) {
                        console.error(`Gagal import user: ${userPayload.email}`, err);
                        duplicateCount++;
                        duplicateList.push(`- ${userPayload.email} (${userPayload.name})`);
                    }
                } else {
                    invalidFormatCount++;
                    let missingFields = [];
                    if (!userPayload.email) missingFields.push('Email');
                    if (!userPayload.password) missingFields.push('Password');
                    if (!userPayload.name) missingFields.push('Nama');
                    if (!userPayload.role) missingFields.push('Role');
                    if (userPayload.balance === undefined || userPayload.balance === null) missingFields.push('Sisa Cuti');
                    if (!hasApprover) missingFields.push('Atasan (TL/SPV/MGR)');
                    
                    const identifier = userPayload.name || userPayload.email || 'Data Tanpa Identitas';
                    invalidFormatList.push(`- ${identifier} [Kolom ${missingFields.join(', ')} wajib diisi]`);
                }
            }

            fetchData();
            handleCloseModal();

            setTimeout(() => {
                let failMsg = '';
                if (duplicateCount > 0) {
                    failMsg += `\n\nData Duplikat/Sudah Ada (${duplicateCount}):\n` + duplicateList.join('\n');
                }
                if (invalidFormatCount > 0) {
                    failMsg += `\n\nFormat Tidak Lengkap (${invalidFormatCount}):\n` + invalidFormatList.join('\n');
                }

                if (successCount > 0) {
                    setAlertModal({
                        show: true,
                        type: 'success',
                        title: 'Import Berhasil',
                        message: `Berhasil mengimpor ${successCount} data user.${failMsg}`
                    });
                } else {
                    setAlertModal({
                        show: true,
                        type: 'error',
                        title: 'Import Gagal',
                        message: `Gagal mengimpor data.${failMsg}`
                    });
                }
            }, 300);

        } catch (error) {
            console.error("Import Error", error);
            setAlertModal({
                show: true,
                type: 'error',
                title: 'Terjadi Kesalahan',
                message: 'File tidak dapat dibaca. Pastikan format .xlsx valid.'
            });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const openEditModal = (u: User) => {
        setEditUser(u);
        setEditFormData({ ...u, password: '' });
        // Reset logic tambah cuti saat buka modal baru
        setProofFile(null);
        setProofDesc('');
        setProofEventDate('');
        setIsAddingLeave(false);
        setAddedLeaveAmount(0);
    };

    const handleEditRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedRole = e.target.value as Role;
        let autoPosition = '';
        switch (selectedRole) {
            case 'User': autoPosition = 'ASST ADM (TAD)'; break;
            case 'TL': autoPosition = 'TL (TAD)'; break;
            case 'SPV': autoPosition = 'Supervisor'; break;
            case 'MGR': autoPosition = 'Manager'; break;
            case 'Admin': autoPosition = 'Administrator'; break;
            default: autoPosition = '';
        }
        setEditFormData({
            ...editFormData, role: selectedRole, position: autoPosition, tlEmail: '', spvEmail: '', mgrEmail: ''
        });
    };

    const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedRole = e.target.value as Role;
        let autoPosition = '';
        switch (selectedRole) {
            case 'User': autoPosition = 'ASST ADM (TAD)'; break;
            case 'TL': autoPosition = 'TL (TAD)'; break;
            case 'SPV': autoPosition = 'Supervisor'; break;
            case 'MGR': autoPosition = 'Manager'; break;
            case 'Admin': autoPosition = 'Administrator'; break;
            default: autoPosition = '';
        }
        setNewUser({
            ...newUser, role: selectedRole, position: autoPosition, tlEmail: '', spvEmail: '', mgrEmail: ''
        });
    };

    // --- PDF GENERATOR LOGIC (IMPROVED FOR PRINTING & ROW HEIGHT) ---
    const generateLeavePDF = (leave: LeaveRequest, targetUser: User) => {
        try {
            const doc = new jsPDF();

            // Set Default Color to Black
            doc.setTextColor(0, 0, 0);

            // 1. ROBUST DATE FORMATTER
            const formatDate = (dateVal: string | Date | undefined, type: 'full' | 'short' = 'full') => {
                if (!dateVal || dateVal === '-') return '-';
                let d = new Date(dateVal);
                if (isNaN(d.getTime())) return '-';

                if (type === 'full') {
                    const dateStr = d.toLocaleDateString('id-ID', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    });
                    return dateStr.replace(',', '');
                } else {
                    return d.toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                    }).replace('.', ':');
                }
            };

            const getApproverName = (email?: string) => {
                if (!email) return '-';
                const u = users.find(x => x.email === email);
                return u ? u.name : email;
            };

            const tlName = getApproverName(leave.approverTL);
            const spvName = getApproverName(leave.approverSPV);

            // --- HEADER SECTION ---
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("PT. SWADHARMA GRIYASATYA", 14, 15);

            doc.setFontSize(14);
            doc.text("SURAT PERMOHONAN CUTI", 105, 30, { align: "center" });

            // --- TIMESTAMP FIX ---
            let submissionTimeStr = leave.createdAt;
            if (!submissionTimeStr || submissionTimeStr === '-' || new Date(submissionTimeStr).toString() === 'Invalid Date') {
                const submitHistory = leave.history?.find(h => h.action === 'SUBMIT');
                if (submitHistory) {
                    submissionTimeStr = submitHistory.timestamp;
                }
            }
            const submissionTimestamp = formatDate(submissionTimeStr, 'short');

            // TABLE DATA
            const tableData = [
                ["Layanan", `: ${targetUser.service}`],
                ["Nama", `: ${targetUser.name}`],
                ["Jabatan", `: ${targetUser.position}`],
                ["Tanggal Mulai Cuti", `: ${new Date(leave.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`],
                ["Tanggal Selesai Cuti", `: ${new Date(leave.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`],
                ["Total Hari", `: ${leave.totalDays} Hari`],
                ["Sisa Cuti", `: ${targetUser.balance} Hari`],
                ["Alasan", `: ${leave.reason}`],
                ["Approver 1 (TL)", `: ${leave.approverTL ? tlName : '-'}`],
                ["Approver 2 (SPV/MGR)", `: ${leave.approverSPV ? spvName : '-'}`]
            ];

            // GENERATE TABLE WITH BOLD BORDERS & WORD-LIKE ROW HEIGHT
            autoTable(doc, {
                startY: 40,
                body: tableData,
                theme: 'grid',
                styles: {
                    font: "helvetica",
                    fontSize: 11,
                    textColor: [0, 0, 0], // Pure Black
                    cellPadding: 2, // 2mm (~8px) results in ~22-24pt row height which matches Word default comfortable
                    lineColor: [0, 0, 0], // Pure Black Border
                    lineWidth: 0.5, // Bold Border
                    valign: 'middle',
                    overflow: 'linebreak'
                },
                columnStyles: {
                    0: { cellWidth: 50, fontStyle: 'normal', valign: 'top' }, // Key column - NORMAL (No Bold)
                    1: { valign: 'top' } // Value column
                }
            });

            const finalY = (doc as any).lastAutoTable.finalY + 10;

            // --- DATE SECTION ---
            const letterDateStr = formatDate(submissionTimeStr, 'full');

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0); // Ensure black
            doc.text(`Tangerang Selatan, ${letterDateStr}`, 195, finalY, { align: 'right' });

            const mengetahuiY = finalY + 20;

            doc.text("Mengetahui:", 14, mengetahuiY);
            doc.text("PT. BANK NEGARA INDONESIA (PERSERO) Tbk.", 14, mengetahuiY + 5);
            doc.text("DIVISI CUSTOMER EXPERIENCE CENTER", 14, mengetahuiY + 10);

            const sigY = mengetahuiY + 25;

            const col1X = 30;  // Pemohon
            const col2X = 105; // Approver 1
            const col3X = 170; // Approver 2

            // Header Kolom Tanda Tangan
            doc.setFont("helvetica", "bold");
            doc.text("Pemohon", col1X, sigY, { align: 'center' });
            doc.text("Approver 1", col2X, sigY, { align: 'center' });
            doc.text("Approver 2", col3X, sigY, { align: 'center' });

            // --- STAMP ICON LOGIC (Vector) ---
            const drawStamp = (cx: number, cy: number, status: string, timestampStr: string) => {
                const r = 6; // Radius lingkaran
                const yCenter = cy + 12;

                let color = [150, 150, 150];

                if (status === 'APPROVED') {
                    color = [34, 197, 94]; // Green-500
                } else if (status === 'REJECTED') {
                    color = [239, 68, 68]; // Red-500
                } else if (status === 'PENDING') {
                    color = [59, 130, 246]; // Blue-500
                }

                // Draw Circle
                doc.setFillColor(color[0], color[1], color[2]);
                doc.setDrawColor(color[0], color[1], color[2]);
                doc.circle(cx, yCenter, r, 'F');

                // Draw Icon
                doc.setDrawColor(255, 255, 255);
                doc.setLineWidth(1.2);

                if (status === 'APPROVED') {
                    doc.line(cx - 2.5, yCenter + 0.5, cx - 1, yCenter + 2.5);
                    doc.line(cx - 1, yCenter + 2.5, cx + 3, yCenter - 2.5);
                } else if (status === 'REJECTED') {
                    doc.line(cx - 2.5, yCenter - 2.5, cx + 2.5, yCenter + 2.5);
                    doc.line(cx + 2.5, yCenter - 2.5, cx - 2.5, yCenter + 2.5);
                } else {
                    doc.line(cx - 2, yCenter, cx + 2, yCenter);
                }

                // Status Label
                doc.setTextColor(color[0], color[1], color[2]);
                doc.setFontSize(9);
                doc.setFont("helvetica", "bolditalic");
                doc.text(status, cx, yCenter + r + 5, { align: 'center' });

                // Timestamp (Posisi Y = Center + Radius + Padding = 12 + 6 + 9 = +27 dari base)
                doc.setTextColor(0, 0, 0); // Hitam pekat for timestamp
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.text(timestampStr, cx, yCenter + r + 10, { align: 'center' });
            };

            const signSpaceY = sigY + 5;

            // 4. [MODIFIED] Signature Pemohon (IMAGE + TIMESTAMP ONLY)
            const imgSize = 15; // Ukuran gambar dalam mm

            try {
                // Gunakan variabel constant di sini
                doc.addImage(CUSTOM_SIGNATURE_BASE64, 'PNG', col1X - (imgSize / 2), signSpaceY + 4.5, imgSize, imgSize);
            } catch (imgError) {
                console.error("Gagal memuat gambar tanda tangan", imgError);
                doc.setFontSize(8);
                doc.setTextColor(255, 0, 0);
                doc.text("[Gagal Muat Gambar]", col1X, signSpaceY + 10, { align: 'center' });
            }

            // Draw Timestamp below image
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(submissionTimestamp, col1X, signSpaceY + 27, { align: 'center' });

            // Nama & Jabatan Pemohon
            const nameY = signSpaceY + 32;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(targetUser.name, col1X, nameY, { align: 'center' });
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(`(${targetUser.position})`, col1X, nameY + 4, { align: 'center' });

            // Helper untuk cari History Approval
            const getApprovalInfo = (stage: string) => {
                const history = Array.isArray(leave.history) ? leave.history : [];
                const found = history.find((h: any) => h.stage === stage);
                if (found) {
                    return {
                        status: found.action,
                        date: formatDate(found.timestamp, 'short') // Uses history timestamp (incl time)
                    };
                }
                return null;
            };

            // 5. Signature Approver 1 (TL)
            if (leave.approverTL) {
                const tlInfo = getApprovalInfo('TL');
                if (tlInfo) {
                    drawStamp(col2X, signSpaceY, tlInfo.status === 'APPROVE' ? 'APPROVED' : 'REJECTED', tlInfo.date);
                } else {
                    if (leave.status === 'REJECTED' && leave.currentPosition === 'User') {
                        drawStamp(col2X, signSpaceY, 'PENDING', '-');
                    } else {
                        drawStamp(col2X, signSpaceY, 'PENDING', '-');
                    }
                }
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(tlName, col2X, nameY, { align: 'center' });
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                // [MODIFIED] Uppercase for Position
                doc.text("(TEAM LEADER)", col2X, nameY + 4, { align: 'center' });
            } else {
                doc.setFontSize(20);
                doc.setTextColor(0, 0, 0);
                doc.text("-", col2X, signSpaceY + 15, { align: 'center' });
            }

            // 6. Signature Approver 2 (SPV/MGR)
            let approver2Email = leave.approverSPV;
            let approver2Role = "Supervisor";
            let approver2Name = spvName;

            if (!leave.approverSPV && leave.approverMGR) {
                approver2Email = leave.approverMGR;
                approver2Role = "Manager";
                approver2Name = getApproverName(leave.approverMGR);
            }

            if (approver2Email) {
                const spvInfo = getApprovalInfo('SPV');
                const mgrInfo = getApprovalInfo('MGR');
                const finalInfo = spvInfo || mgrInfo;

                if (finalInfo) {
                    drawStamp(col3X, signSpaceY, finalInfo.status === 'APPROVE' ? 'APPROVED' : 'REJECTED', finalInfo.date);
                } else {
                    drawStamp(col3X, signSpaceY, 'PENDING', '-');
                }

                doc.setTextColor(0, 0, 0);
                doc.setFontSize(10);
                doc.setFont("helvetica", "bold");
                doc.text(approver2Name, col3X, nameY, { align: 'center' });
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                // [MODIFIED] Uppercase for Position
                doc.text(`(${approver2Role.toUpperCase()})`, col3X, nameY + 4, { align: 'center' });
            } else {
                doc.setFontSize(20);
                doc.setTextColor(0, 0, 0);
                doc.text("-", col3X, signSpaceY + 15, { align: 'center' });
            }

            doc.save(`Surat_Cuti_${targetUser.name}_${leave.startDate}.pdf`);

        } catch (err: any) {
            console.error("PDF Generation Error:", err);
            setAlertModal({ show: true, title: 'Gagal Membuat PDF', message: `Gagal membuat PDF. Pesan Error: ${err.message}`, type: 'error' });
        }
    };

    const handleExportExcel = () => {
        const headers = ["Email", "Password", "Role", "Nama", "HQ", "Sisa Cuti", "Jabatan", "Layanan", "Vendor", "TL", "SPV", "MGR"];
        const dataRows = users.map(u => [
            u.email, u.password || '******', u.role, u.name, u.hq || '-', u.balance, u.position, u.service, u.vendor || '-', u.tlEmail || '-', u.spvEmail || '-', u.mgrEmail || '-'
        ]);
        const allData = [headers, ...dataRows];
        const ws = XLSX.utils.aoa_to_sheet(allData);

        const colWidths = headers.map(() => ({ wch: 10 }));
        
        for (let R = 0; R < allData.length; ++R) {
            for (let C = 0; C < allData[R].length; ++C) {
                const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cellRef]) continue;

                const cellTextLength = ws[cellRef].v ? ws[cellRef].v.toString().length : 0;
                if (cellTextLength > colWidths[C].wch) {
                    colWidths[C].wch = cellTextLength + 2;
                }

                let style: any = {
                    border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } }
                    },
                    alignment: { vertical: 'center', horizontal: 'left' }
                };

                if (C === 2 || C === 4) {
                    style.alignment.horizontal = 'center';
                }

                if (R === 0) {
                    style.fill = { fgColor: { rgb: "FFCC99" } };
                    style.font = { bold: true, color: { rgb: "000000" } };
                    style.alignment.horizontal = 'center';
                }

                ws[cellRef].s = style;
            }
        }
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Karyawan");
        XLSX.writeFile(wb, "data_karyawan_ecuti.xlsx");
    };

    const handleDownloadTemplate = () => {
        const headers = ["Email", "Password", "Role", "Nama", "Sisa Cuti", "Jabatan", "Layanan", "Vendor", "TL", "SPV", "MGR"];
        const sampleData = [
            ["john.doe@example.com", "password123", "User", "John Doe", 12, "Staff", "IT", "-", "tl@example.com", "spv@example.com", "mgr@example.com"],
            ["jane.smith@example.com", "pass456", "TL", "Jane Smith", 10, "Team Lead", "IT", "-", "-", "spv@example.com", "mgr@example.com"]
        ];
        const allData = [headers, ...sampleData];
        const ws = XLSX.utils.aoa_to_sheet(allData);

        const colWidths = headers.map(() => ({ wch: 10 }));
        for (let R = 0; R < allData.length; ++R) {
            for (let C = 0; C < allData[R].length; ++C) {
                const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cellRef]) continue;

                const cellTextLength = ws[cellRef].v ? ws[cellRef].v.toString().length : 0;
                if (cellTextLength > colWidths[C].wch) colWidths[C].wch = cellTextLength + 2;

                let style: any = {
                    border: {
                        top: { style: 'thin', color: { rgb: "000000" } },
                        bottom: { style: 'thin', color: { rgb: "000000" } },
                        left: { style: 'thin', color: { rgb: "000000" } },
                        right: { style: 'thin', color: { rgb: "000000" } }
                    },
                    alignment: { vertical: 'center', horizontal: 'left' }
                };
                if (C === 2 || C === 4) style.alignment.horizontal = 'center';
                if (R === 0) {
                    style.fill = { fgColor: { rgb: "FFCC99" } };
                    style.font = { bold: true, color: { rgb: "000000" } };
                    style.alignment.horizontal = 'center';
                }
                ws[cellRef].s = style;
            }
        }
        ws['!cols'] = colWidths;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Import");
        XLSX.writeFile(wb, "template_import_user.xlsx");
    };


    const getUserStats = (email: string) => {
        const userLeaves = leaves.filter(l => l.userEmail === email);
        return {
            pending: userLeaves.filter(l => l.status === 'PENDING').length,
            approved: userLeaves.filter(l => l.status === 'APPROVED').length,
            rejected: userLeaves.filter(l => l.status === 'REJECTED').length,
        };
    };

    const getApproverOptions = (role: Role) => {
        const currentService = editUser ? editFormData.service : newUser.service;
        return users.filter(u => u.role === role && u.service === currentService);
    };

    // Filter & Pagination Logic
    let filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.service || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterService !== 'All') {
        filteredUsers = filteredUsers.filter(u => u.service === filterService);
    }

    if (sortNameAsc !== null) {
        filteredUsers.sort((a, b) => {
            if (a.name < b.name) return sortNameAsc ? -1 : 1;
            if (a.name > b.name) return sortNameAsc ? 1 : -1;
            return 0;
        });
    }

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const showTLInput = newUser.role === 'User';
    const showSPVInput = newUser.role === 'User' || newUser.role === 'TL';
    const showMGRInput = newUser.role === 'User' || newUser.role === 'TL' || newUser.role === 'SPV';

    // --- RENDER MODALS (FULL CODE) ---

    const renderAlertModal = () => {
        if (!alertModal.show) return null;
        const isSuccess = alertModal.type === 'success';
        const bgColor = isSuccess ? 'bg-green-100' : 'bg-red-100';
        const iconColor = isSuccess ? 'text-green-600' : 'text-red-600';
        const buttonColor = isSuccess ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200';
        const Icon = isSuccess ? CheckCircle : XCircle;

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-6 transform scale-100 transition-all animate-in zoom-in-95">
                    <div className={`w-16 h-16 ${bgColor} rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm`}>
                        <Icon size={32} className={iconColor} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{alertModal.title}</h2>
                    <div className="max-h-48 overflow-y-auto mb-6 text-left border rounded-lg bg-gray-50 p-3 scrollbar-thin">
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                            {alertModal.message}
                        </p>
                    </div>
                    <button
                        onClick={() => setAlertModal({ ...alertModal, show: false })}
                        className={`w-full py-2.5 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-[1.02] ${buttonColor}`}
                    >
                        {isSuccess ? 'OK, Mengerti' : 'Tutup'}
                    </button>
                </div>
            </div>
        );
    };

    const renderAddUserModal = () => {
        if (view !== 'add-user') return null;
        const isAddAdmin = newUser.role === 'Admin';
        const showVendor = newUser.role !== 'Admin' && newUser.role !== 'SPV' && newUser.role !== 'MGR';
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform scale-100 transition-all">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg mr-3 text-blue-600"><UserPlus size={24} /></div>
                            Tambah User Baru
                        </h2>
                        <div className="flex items-center space-x-2">
                            <button type="button" onClick={() => navigate('/admin/export')} className="flex items-center px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition font-medium text-sm border border-green-200">
                                <Download size={16} className="mr-1.5" /> Export Data User
                            </button>
                            <button type="button" onClick={() => navigate('/admin/import')} className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition font-medium text-sm border border-blue-200">
                                <FileUp size={16} className="mr-1.5" /> Import Data User
                            </button>
                            <button type="button" onClick={handleCloseModal} className="p-2 ml-2 hover:bg-gray-100 rounded-full transition text-gray-500 hover:text-gray-700"><X size={24} /></button>
                        </div>
                    </div>
                    <form onSubmit={handleCreateUser} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                <input type="email" className={`w-full border ${formErrors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-3 focus:ring-2 outline-none transition`} value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="Masukkan email karyawan" />
                                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                                <div className="relative">
                                    <input type={showPassword ? "text" : "password"} className={`w-full border ${formErrors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-3 pr-10 focus:ring-2 outline-none transition`} value={newUser.password || ''} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="Masukkan password user" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap</label>
                                <input type="text" className={`w-full border ${formErrors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-3 focus:ring-2 outline-none transition`} value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Nama Karyawan" />
                                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">HQ</label>
                                <input type="text" className="w-full border border-gray-300 focus:ring-blue-500 rounded-lg p-3 focus:ring-2 outline-none transition" value={newUser.hq || ''} onChange={e => setNewUser({ ...newUser, hq: e.target.value })} placeholder="Masukkan HQ" />
                            </div>
                            {showVendor && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Vendor</label>
                                    <select className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" value={newUser.vendor || ''} onChange={e => setNewUser({ ...newUser, vendor: e.target.value })}>
                                        <option value="">Pilih Vendor</option><option value="PT. AOS">PT. AOS</option><option value="PT. SGRS">PT. SGRS</option><option value="PT. SJS">PT. SJS</option><option value="PT. VALDO">PT. VALDO</option>
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Role System</label>
                                <select className={`w-full border ${formErrors.role ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-3 bg-white focus:ring-2 outline-none transition`} value={newUser.role} onChange={handleRoleChange}>
                                    <option value="User">ASST ADM (TAD)</option><option value="TL">TL (TAD)</option><option value="SPV">Supervisor</option><option value="MGR">Manager</option><option value="Admin">Administrator</option>
                                </select>
                                {formErrors.role && <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>}
                            </div>
                            {!isAddAdmin && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Sisa Cuti</label>
                                    <input type="number" className={`w-full border ${formErrors.balance ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} rounded-lg p-3 focus:ring-2 outline-none transition`} value={newUser.balance} onChange={e => setNewUser({ ...newUser, balance: parseInt(e.target.value) })} />
                                    {formErrors.balance && <p className="text-red-500 text-xs mt-1">{formErrors.balance}</p>}
                                </div>
                            )}
                            {!isAddAdmin && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Layanan</label>
                                    <select className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition" value={newUser.service || ''} onChange={e => { setNewUser({ ...newUser, service: e.target.value, tlEmail: '', spvEmail: '', mgrEmail: '' }); }}>
                                        <option value="">Pilih Layanan</option>
                                        {servicesList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Jabatan (Position)</label>
                                <input type="text" disabled className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100 text-gray-600 focus:outline-none cursor-not-allowed font-medium" placeholder="Otomatis terisi berdasarkan Role" value={newUser.position} />
                            </div>
                        </div>
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mt-4">
                            <div className="flex justify-between items-center mb-4 border-b border-blue-200 pb-2">
                                <h3 className="text-md font-bold text-blue-800 flex items-center"><AlertTriangle size={18} className="mr-2" />Approval</h3>
                                <div className="text-xs text-blue-700 bg-white/50 px-3 py-1 rounded-full border border-blue-200">Divisi : <b>CUSTOMER EXPERIENCE CENTER</b></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {showTLInput && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Team Leader (TL)</label>
                                        <select className={`w-full text-sm border ${formErrors.approver ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-400'} rounded-lg p-2.5 bg-white focus:ring-2 outline-none`} value={newUser.tlEmail || ''} onChange={e => setNewUser({ ...newUser, tlEmail: e.target.value })}>
                                            <option value="">-- Tidak Ada TL --</option>{getApproverOptions('TL').map(u => (<option key={u.email} value={u.email}>{u.name}</option>))}
                                        </select>
                                    </div>
                                )}
                                {showSPVInput && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Supervisor (SPV) {(newUser.role === 'User' || newUser.role === 'TL') && <span className="text-red-500">*</span>}</label>
                                        <select className={`w-full text-sm border ${(formErrors.approver || formErrors.spvEmail) ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-400'} rounded-lg p-2.5 bg-white focus:ring-2 outline-none`} value={newUser.spvEmail || ''} onChange={e => setNewUser({ ...newUser, spvEmail: e.target.value })}>
                                            <option value="">-- Pilih SPV --</option>{getApproverOptions('SPV').map(u => (<option key={u.email} value={u.email}>{u.name}</option>))}
                                        </select>
                                        {formErrors.spvEmail && <p className="text-red-500 text-xs mt-1">{formErrors.spvEmail}</p>}
                                    </div>
                                )}
                                {showMGRInput && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">Manager (MGR)</label>
                                        <select className={`w-full text-sm border ${formErrors.approver ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-400'} rounded-lg p-2.5 bg-white focus:ring-2 outline-none`} value={newUser.mgrEmail || ''} onChange={e => setNewUser({ ...newUser, mgrEmail: e.target.value })}>
                                            <option value="">-- Pilih MGR --</option>{getApproverOptions('MGR').map(u => (<option key={u.email} value={u.email}>{u.name}</option>))}
                                        </select>
                                    </div>
                                )}
                            </div>
                            {formErrors.approver && <p className="text-red-500 text-xs mt-2 font-medium">{formErrors.approver}</p>}
                        </div>
                        <div className="flex justify-end pt-4 border-t gap-3">
                            <button type="button" onClick={handleCloseModal} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition">Batal</button>
                            <button type="submit" className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 flex items-center transform hover:scale-105 transition"><Save size={18} className="mr-2" /> Simpan User</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const handleExportLeavesExcel = () => {
        const headers = ["ID", "Email Pemohon", "Nama", "HQ", "Layanan", "Tanggal Mulai", "Tanggal Selesai", "Total Hari", "Status", "Alasan"];
        const dataRows = leaves.map(l => {
            const leaveUser = users.find(u => u.email === l.userEmail);
            return [
                l.id, l.userEmail, l.userName, leaveUser?.hq || '-', l.service, l.startDate, l.endDate, l.totalDays, l.status, l.reason
            ];
        });
        const allData = [headers, ...dataRows];
        const ws = XLSX.utils.aoa_to_sheet(allData);
        
        // Header Styling
        const range = XLSX.utils.decode_range(ws['!ref'] || "A1:I1");
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const address = XLSX.utils.encode_col(C) + "1";
          if (!ws[address]) continue;
          ws[address].s = {
            fill: { fgColor: { rgb: "2563EB" } },
            font: { color: { rgb: "FFFFFF" }, bold: true }
          };
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Cuti");
        XLSX.writeFile(wb, "data_cuti_karyawan.xlsx");
    };

    const handleExportLeavesPDF = () => {
        const doc = new jsPDF();
        doc.text("Laporan Data Cuti Karyawan", 14, 15);
        
        const tableColumn = ["Nama", "HQ", "Layanan", "Mulai", "Selesai", "Hari", "Status", "Alasan"];
        const tableRows: any[] = [];

        leaves.forEach(l => {
          const leaveUser = users.find(u => u.email === l.userEmail);
          const rowData = [
            l.userName,
            leaveUser?.hq || '-',
            l.service,
            new Date(l.startDate).toLocaleDateString('id-ID'),
            new Date(l.endDate).toLocaleDateString('id-ID'),
            l.totalDays,
            l.status,
            l.reason
          ];
          tableRows.push(rowData);
        });

        (doc as any).autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 20,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [37, 99, 235] }
        });

        doc.save(`Laporan_Cuti_${new Date().getTime()}.pdf`);
    };

    const renderExportModal = () => {
        if (view !== 'export') return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-0 overflow-hidden transform scale-100 transition-all">
                    <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Export Data</h2>
                            <p className="text-green-100 text-sm">Unduh laporan data karyawan dan data cuti.</p>
                        </div>
                        <button onClick={handleCloseModal} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition text-white"><X size={20} /></button>
                    </div>
                    <div className="p-8">
                        <div className="mb-6 pb-6 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-2">1. Data Karyawan (Users)</h3>
                            <p className="text-sm text-gray-500 mb-4">Mencakup saldo cuti, struktur approval, dan profil karyawan.</p>
                            <button onClick={handleExportExcel} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition flex items-center justify-center shadow-md"><FileDown size={20} className="mr-2" /> Export User (Excel)</button>
                        </div>
                        
                        <div>
                            <h3 className="font-bold text-gray-800 mb-2">2. Laporan Cuti (Leaves)</h3>
                            <p className="text-sm text-gray-500 mb-4">Mencakup riwayat pengajuan cuti beserta statusnya.</p>
                            <div className="flex gap-4">
                                <button onClick={handleExportLeavesExcel} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center shadow-md"><FileDown size={20} className="mr-2" /> Export (Excel)</button>
                                <button onClick={handleExportLeavesPDF} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition flex items-center justify-center shadow-md"><FileDown size={20} className="mr-2" /> Export (PDF)</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderImportModal = () => {
        if (view !== 'import') return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-0 overflow-hidden transform scale-100 transition-all">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">Import Data User</h2>
                            <p className="text-blue-100 text-sm">Upload data karyawan via .XLSX</p>
                        </div>
                        <button onClick={handleCloseModal} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition text-white"><X size={20} /></button>
                    </div>
                    <div className="p-8 text-center">
                        {isImporting ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <Loader size={48} className="text-blue-600 animate-spin mb-4" />
                                <p className="text-gray-600 font-bold">Memproses Data...</p>
                                <p className="text-xs text-gray-400">Mohon tunggu sebentar.</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><FileUp size={48} className="text-blue-600" /></div>
                                <div className="flex justify-center mb-4">
                                    <button onClick={handleDownloadTemplate} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold hover:bg-indigo-100 transition border border-indigo-200 shadow-sm text-sm">
                                        <Download size={16} className="mr-2" /> Download Template Import
                                    </button>
                                </div>
                                <p className="text-gray-600 mb-6 text-sm">Pastikan format .xlsx sesuai template. Data yang diupload akan ditambahkan (Email sama akan dilewati/gagal).</p>
                                <input type="file" accept=".xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleImportFile} />
                                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-8 mb-6 hover:bg-blue-50 transition cursor-pointer group">
                                    <p className="font-bold text-blue-600 group-hover:text-blue-700">Klik untuk pilih file .XLSX</p>
                                    <p className="text-xs text-gray-400 mt-2">atau drag & drop file di sini</p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={handleCloseModal} className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition border border-gray-200">Batal</button>
                                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition flex items-center justify-center"><FileUp size={20} className="mr-2" /> Upload</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderDetailModal = () => {
        if (!detailUser) return null;
        const getApproverName = (email?: string) => {
            if (!email) return '-';
            const u = users.find(x => x.email === email);
            return u ? u.name : email;
        };
        const fields = [
            { l: "Nama Lengkap", v: detailUser.name },
            { l: "HQ", v: detailUser.hq || '-' },
            { l: "Email", v: detailUser.email },
            { l: "Role", v: detailUser.role },
            { l: "Jabatan", v: detailUser.position },
        ];
        if (detailUser.role !== 'Admin' && detailUser.role !== 'SPV' && detailUser.role !== 'MGR') {
            fields.push({ l: "Vendor", v: detailUser.vendor || '-' });
        }
        fields.push(
            { l: "Layanan", v: detailUser.service },
            { l: "Sisa Cuti", v: detailUser.balance + " Hari" }
        );
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform scale-100 transition-all">
                    <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-6 text-white flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold flex items-center"><Eye size={24} className="mr-2" /> Detail User</h2>
                            <p className="text-gray-300 text-sm">Mode lihat saja (Read-only)</p>
                        </div>
                        <button onClick={() => setDetailUser(null)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"><X size={20} /></button>
                    </div>
                    <div className="max-h-[80vh] overflow-y-auto bg-gray-50">
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {fields.map((item, i) => (
                                <div key={i} className="relative group">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{item.l}</label>
                                    <div className="flex items-center">
                                        <input type="text" value={item.v} disabled readOnly className="w-full bg-gray-200 border border-gray-300 text-gray-600 font-semibold p-3 rounded-lg cursor-not-allowed focus:outline-none" />
                                        <Ban className="absolute right-3 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" size={18} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-8 pb-8">
                            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center border-b border-gray-100 pb-2"><AlertTriangle size={16} className="mr-2 text-blue-600" />Approval</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Team Leader</label>
                                        <p className="text-sm font-bold text-gray-800 break-words">{getApproverName(detailUser.tlEmail)}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Supervisor</label>
                                        <p className="text-sm font-bold text-gray-800 break-words">{getApproverName(detailUser.spvEmail)}</p>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Manager</label>
                                        <p className="text-sm font-bold text-gray-800 break-words">{getApproverName(detailUser.mgrEmail)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-gray-100 border-t border-gray-200 text-center">
                        <button onClick={() => setDetailUser(null)} className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700">Tutup</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderEditModal = () => {
        if (!editUser) return null;
        const isEditAdmin = editFormData.role === 'Admin';
        const showVendor = editFormData.role !== 'Admin' && editFormData.role !== 'SPV' && editFormData.role !== 'MGR';
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform scale-100 transition-all">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <div className="p-2 bg-amber-100 rounded-lg mr-3 text-amber-600"><Edit size={24} /></div>
                            Edit Data User
                        </h2>
                        <button onClick={() => setEditUser(null)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"><X size={24} /></button>
                    </div>
                    <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 flex items-center">
                            <Lock className="text-amber-500 mr-3" size={20} />
                            <span className="text-sm text-amber-800">Email tidak dapat diubah (Primary Key).</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                <input type="email" disabled className="w-full border border-gray-200 bg-gray-100 text-gray-500 rounded-lg p-3 cursor-not-allowed font-medium" value={editFormData.email} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Password Baru <span className="font-normal text-gray-400">(Opsional)</span></label>
                                <input type="text" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500" value={editFormData.password} onChange={e => setEditFormData({ ...editFormData, password: e.target.value })} placeholder="Kosongkan jika tidak ingin ubah" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lengkap</label>
                                <input type="text" required className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">HQ</label>
                                <input type="text" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-amber-500" value={editFormData.hq || ''} onChange={e => setEditFormData({ ...editFormData, hq: e.target.value })} placeholder="Masukkan HQ" />
                            </div>
                            {showVendor && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Vendor</label>
                                    <select className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-amber-500 outline-none transition" value={editFormData.vendor || ''} onChange={e => setEditFormData({ ...editFormData, vendor: e.target.value })} required>
                                        <option value="">Pilih Vendor</option><option value="PT. AOS">PT. AOS</option><option value="PT. SGRS">PT. SGRS</option><option value="PT. SJS">PT. SJS</option><option value="PT. VALDO">PT. VALDO</option>
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Role System</label>
                                <select className="w-full border border-gray-300 rounded-lg p-3 bg-white" value={editFormData.role} onChange={handleEditRoleChange}>
                                    <option value="User">ASST ADM (TAD)</option><option value="TL">TL (TAD)</option><option value="SPV">Supervisor</option><option value="MGR">Manager</option><option value="Admin">Administrator</option>
                                </select>
                            </div>
                            {!isEditAdmin && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Layanan</label>
                                    <select className="w-full border border-gray-300 rounded-lg p-3 bg-white" value={editFormData.service || ''} onChange={e => setEditFormData({ ...editFormData, service: e.target.value })}>
                                        <option value="">Pilih Layanan</option>
                                        {servicesList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}
                            {!isEditAdmin && (
                                <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-gray-100">
                                    <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center">Pengaturan Sisa Cuti</label>
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                        <div className="flex flex-col md:flex-row gap-6 items-start">
                                            <div className="w-full md:w-1/3 space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-blue-800 mb-1">Sisa Cuti Saat Ini (Read-Only)</label>
                                                    <input type="number" disabled className="w-full bg-gray-100 border border-gray-300 text-gray-500 rounded-lg p-3 font-bold text-center text-lg cursor-not-allowed" value={editUser.balance} />
                                                </div>
                                                <div className="flex items-center bg-white p-3 rounded-lg border border-blue-200 shadow-sm cursor-pointer hover:bg-blue-50 transition" onClick={() => setIsAddingLeave(!isAddingLeave)}>
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition ${isAddingLeave ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
                                                        {isAddingLeave && <CheckSquare size={14} className="text-white" />}
                                                    </div>
                                                    <span className="text-sm font-bold text-blue-900 select-none">Tambah Kuota Cuti?</span>
                                                </div>
                                            </div>
                                            {isAddingLeave && (
                                                <div className="flex-1 w-full border-l-0 md:border-l border-blue-200 pl-0 md:pl-6 animate-in fade-in slide-in-from-left-4">
                                                    <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm mb-3">
                                                        <label className="block text-xs font-bold text-blue-800 mb-2">Jumlah Penambahan (Hari)</label>
                                                        <div className="flex items-center">
                                                            <div className="bg-blue-100 p-2 rounded-l-lg border border-blue-200 border-r-0 text-blue-600"><PlusSquare size={20} /></div>
                                                            <input type="number" min="1" className="w-full border border-blue-200 rounded-r-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: 3" value={addedLeaveAmount} onChange={e => setAddedLeaveAmount(parseInt(e.target.value) || 0)} />
                                                        </div>
                                                    </div>
                                                    <label className="block text-xs font-bold text-blue-800 mb-2 flex items-center">Bukti & Keterangan <span className="ml-2 text-[10px] text-white bg-red-500 px-2 py-0.5 rounded-full">WAJIB</span></label>
                                                    <div className="space-y-3">
                                                        <div className="relative group">
                                                            <input type="file" id="proofUpload" className="hidden" accept="image/*" onChange={(e) => { if (e.target.files && e.target.files[0]) { setProofFile(e.target.files[0]); } }} />
                                                            <label htmlFor="proofUpload" className={`flex items-center justify-center w-full p-3 border border-dashed rounded-lg bg-white cursor-pointer transition text-sm ${proofFile ? 'border-green-400 text-green-700 bg-green-50' : 'border-blue-300 text-blue-600 hover:bg-blue-50'}`}>
                                                                <Upload size={16} className="mr-2" /> {proofFile ? proofFile.name : "Upload Bukti (Gambar)"}
                                                            </label>
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-blue-800 mb-1">Tanggal Masuk Cuti Bersama</label>
                                                            <input type="date" className="w-full border border-blue-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required value={proofEventDate} onChange={e => setProofEventDate(e.target.value)} />
                                                        </div>
                                                        <textarea className="w-full border border-blue-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none" rows={2} placeholder="Keterangan penambahan (Wajib diisi)..." value={proofDesc} onChange={e => setProofDesc(e.target.value)} />
                                                    </div>
                                                </div>
                                            )}
                                            {!isAddingLeave && (
                                                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm italic border-l border-gray-200 pl-6">Centang "Tambah Kuota Cuti" untuk menyesuaikan saldo.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!isEditAdmin && (
                            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-600 mb-3">Update Approval</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">TL</label>
                                        <select className="w-full text-sm border border-gray-300 rounded p-2" value={editFormData.tlEmail || ''} onChange={e => setEditFormData({ ...editFormData, tlEmail: e.target.value })}>
                                            <option value="">-- Tidak Ada --</option>{getApproverOptions('TL').map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">SPV</label>
                                        <select className="w-full text-sm border border-gray-300 rounded p-2" value={editFormData.spvEmail || ''} onChange={e => setEditFormData({ ...editFormData, spvEmail: e.target.value })}>
                                            <option value="">-- Pilih SPV --</option>{getApproverOptions('SPV').map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">MGR</label>
                                        <select className="w-full text-sm border border-gray-300 rounded p-2" value={editFormData.mgrEmail || ''} onChange={e => setEditFormData({ ...editFormData, mgrEmail: e.target.value })}>
                                            <option value="">-- Pilih MGR --</option>{getApproverOptions('MGR').map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-end pt-4 border-t gap-3">
                            <button type="button" onClick={() => setEditUser(null)} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">Batal</button>
                            <button type="submit" className="px-8 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 shadow-lg flex items-center"><Save size={18} className="mr-2" /> Update Data</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const renderDeleteModal = () => {
        if (!deleteTarget) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"><Trash2 size={40} className="text-red-600" /></div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Hapus User?</h2>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">Anda akan menghapus user <b>{deleteTarget.name}</b>. <br /><span className="text-red-500 font-bold">Semua data cuti terkait akan hilang permanen!</span></p>
                    <div className="flex gap-4">
                        <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Batal</button>
                        <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition">Ya, Hapus</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderDeleteServiceModal = () => {
        if (!deleteServiceTarget) return null;
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"><Trash2 size={40} className="text-red-600" /></div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Hapus Layanan?</h2>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">Anda akan menghapus layanan <b>{deleteServiceTarget.name}</b>. <br /><span className="text-red-500 font-bold">Aksi ini tidak dapat dibatalkan!</span></p>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setDeleteServiceTarget(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Batal</button>
                        <button type="button" onClick={confirmDeleteService} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition">Ya, Hapus</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderDocumentModal = () => {
        if (!selectedUserForDoc) return null;
        const userLeaves = leaves.filter(l => l.userEmail === selectedUserForDoc.email);
        const renderApprovalSteps = (leave: LeaveRequest) => {
            const steps = [];
            if (leave.approverTL) steps.push({ role: 'TL', email: leave.approverTL });
            if (leave.approverSPV) steps.push({ role: 'SPV', email: leave.approverSPV });
            if (leave.approverMGR) steps.push({ role: 'MGR', email: leave.approverMGR });
            return (
                <div className="flex items-center justify-center space-x-4">
                    {steps.map((step, idx) => {
                        let status = 'PENDING';
                        const historyItem = leave.history.find(h => h.stage === step.role);
                        if (historyItem) {
                            status = historyItem.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
                        }
                        let Icon = Clock;
                        let color = 'text-gray-300';
                        if (status === 'APPROVED') { Icon = CheckCircle; color = 'text-green-500'; }
                        if (status === 'REJECTED') { Icon = Ban; color = 'text-red-500'; }
                        return (
                            <div key={idx} className="flex flex-col items-center">
                                <Icon size={24} className={color} />
                                <span className={`text-[10px] font-bold mt-1 ${color === 'text-gray-300' ? 'text-gray-400' : 'text-gray-500'}`}>{step.role}</span>
                            </div>
                        );
                    })}
                </div>
            )
        };
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">Dokumen User</h3>
                            <p className="text-purple-600 font-medium text-sm mt-1">
                                {selectedUserForDoc.name} <span className="text-purple-600">({selectedUserForDoc.email})</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleViewHistory(selectedUserForDoc)} className="px-4 py-2 bg-orange-50 text-orange-600 rounded-full hover:bg-orange-100 transition flex items-center text-xs font-bold border border-orange-100">
                                <History size={16} className="mr-2" /> Riwayat Penambahan Cuti
                            </button>
                            <button onClick={() => setSelectedUserForDoc(null)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>
                    </div>
                    <div className="p-0 bg-white overflow-y-auto flex-1">
                        {userLeaves.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><FolderOpen size={30} className="text-gray-400" /></div>
                                <p className="text-gray-500">Belum ada riwayat dokumen.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                        <th className="px-8 py-4">TANGGAL / ALASAN</th>
                                        <th className="px-6 py-4 text-center">STATUS</th>
                                        <th className="px-6 py-4 text-center">AKSI</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {userLeaves.map(leave => (
                                        <tr key={leave.id} className="hover:bg-gray-50 transition">
                                            <td className="px-8 py-5">
                                                <div className="font-bold text-gray-800 text-base mb-1">
                                                    {new Date(leave.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} s/d {new Date(leave.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-gray-500 italic text-sm">"{leave.reason}"</div>
                                            </td>
                                            <td className="px-6 py-5 text-center align-middle">
                                                {renderApprovalSteps(leave)}
                                            </td>
                                            <td className="px-6 py-5 text-center align-middle">
                                                <button onClick={() => generateLeavePDF(leave, selectedUserForDoc)} className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-200 transition shadow-sm">
                                                    <FileDown size={16} className="mr-2" /> Unduh
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // State History
    const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null);
    const [balanceHistory, setBalanceHistory] = useState<any[]>([]);

    const handleViewHistory = async (u: User) => {
        setSelectedUserForHistory(u);
        setBalanceHistory([]);
        try {
            const data = await apiService.getBalanceHistory(u.email);
            setBalanceHistory(data);
        } catch (error) {
            console.error(error);
            setAlertModal({ show: true, title: 'Gagal Memuat Riwayat', message: 'Gagal memuat riwayat penambahan cuti.', type: 'error' });
        }
    };

    const renderHistoryModal = () => {
        if (!selectedUserForHistory) return null;
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <History className="text-orange-500" /> Riwayat Penambahan Cuti
                            </h3>
                            <p className="text-gray-500 font-medium text-sm mt-1">
                                {selectedUserForHistory.name} <span className="text-gray-400">({selectedUserForHistory.email})</span>
                            </p>
                        </div>
                        <button onClick={() => setSelectedUserForHistory(null)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600"><X size={24} /></button>
                    </div>
                    <div className="p-0 bg-white overflow-y-auto flex-1">
                        {balanceHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><History size={30} className="text-gray-400" /></div>
                                <p className="text-gray-500">Belum ada riwayat penambahan cuti.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-orange-50 text-orange-800 text-xs font-bold uppercase tracking-wider">
                                        <th className="px-6 py-4">TANGGAL</th>
                                        <th className="px-6 py-4">JUMLAH</th>
                                        <th className="px-6 py-4">KETERANGAN</th>
                                        <th className="px-6 py-4 text-center">DOKUMEN</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {balanceHistory.map((h: any) => (
                                        <tr key={h.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 font-medium text-gray-600">
                                                {(() => {
                                                    const d = new Date(h.createdAt);
                                                    return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} | ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':')} WIB`;
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-green-600 text-lg">
                                                +{h.amount} Hari
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 italic">
                                                {h.description}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {h.proofFile ? (
                                                    <a
                                                        href={`http://localhost:3002/uploads/${h.proofFile}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-xs font-bold hover:bg-blue-100 transition border border-blue-100"
                                                    >
                                                        <Eye size={14} className="mr-1" /> Lihat PDF
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">- Tidak ada -</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const handleAddService = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!newServiceName.trim()) {
            setAlertModal({ show: true, title: 'Peringatan', message: 'Nama layanan tidak boleh kosong.', type: 'error' });
            return;
        }
        try {
            await apiService.addService(newServiceName.trim());
            setNewServiceName('');
            setAlertModal({ show: true, title: 'Sukses', message: 'Layanan berhasil ditambahkan.', type: 'success' });
            fetchData();
        } catch (error: any) {
            setAlertModal({ show: true, title: 'Gagal', message: error.message || 'Terjadi kesalahan.', type: 'error' });
        }
    };

    const handleUpdateService = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!editServiceObj || !editServiceObj.name.trim()) {
            setAlertModal({ show: true, title: 'Peringatan', message: 'Nama layanan tidak boleh kosong.', type: 'error' });
            return;
        }
        try {
            await apiService.updateService(editServiceObj.id, editServiceObj.name.trim());
            setEditServiceObj(null);
            setAlertModal({ show: true, title: 'Sukses', message: 'Layanan berhasil diubah.', type: 'success' });
            fetchData();
        } catch (error: any) {
            setAlertModal({ show: true, title: 'Gagal', message: error.message || 'Terjadi kesalahan.', type: 'error' });
        }
    };

    const renderManageServices = () => {
        if (view !== 'services') return null;
        return (
            <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6 animate-in fade-in duration-300 ${view === 'services' ? 'flex-1 flex flex-col min-h-0' : ''}`}>
                <div className="shrink-0 flex flex-wrap items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <Layers className="mr-3 text-blue-600" size={24} />
                            Manage Layanan
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Kelola daftar layanan (Service) untuk departemen Anda.</p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                        <button type="button" onClick={() => setIsAddServiceModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-md shadow-blue-200 transition flex items-center text-sm">
                            <PlusSquare size={16} className="mr-2" /> Tambah Layanan
                        </button>
                    </div>
                </div>
                <div className="p-0 flex-1 overflow-hidden flex flex-col min-h-0">

                    {isAddServiceModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                                <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
                                    <h3 className="font-bold text-lg">Tambah Layanan</h3>
                                    <button onClick={() => setIsAddServiceModalOpen(false)} className="hover:bg-blue-700 p-1 rounded-full transition"><X size={20}/></button>
                                </div>
                                <div className="p-6">
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nama Layanan</label>
                                        <input type="text" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { handleAddService(); setIsAddServiceModalOpen(false); } }} placeholder="Contoh: IT Support" autoFocus />
                                    </div>
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button onClick={() => setIsAddServiceModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg font-bold transition">Batal</button>
                                        <button onClick={() => { handleAddService(); setIsAddServiceModalOpen(false); }} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">Simpan</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto w-full relative">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-400 uppercase">
                                <tr>
                                    <th className="px-4 py-2.5 font-bold sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">ID</th>
                                    <th className="px-4 py-2.5 font-bold sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">Nama Layanan</th>
                                    <th className="px-4 py-2.5 text-center font-bold sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {servicesList.map((service, index) => (
                                    <tr key={service.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-2.5 font-medium">{index + 1}</td>
                                        <td className="px-4 py-2.5 font-bold text-gray-800">
                                            {editServiceObj?.id === service.id ? (
                                                <input type="text" className="w-full border border-blue-300 rounded p-1.5 outline-none focus:ring-2 focus:ring-blue-500" value={editServiceObj.name} onChange={e => setEditServiceObj({ ...editServiceObj, name: e.target.value })} />
                                            ) : (
                                                service.name
                                            )}
                                        </td>
                                        <td className="px-4 py-2.5 text-center">
                                            {editServiceObj?.id === service.id ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button type="button" onClick={handleUpdateService} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg transition" title="Simpan"><Save size={16} /></button>
                                                    <button type="button" onClick={() => setEditServiceObj(null)} className="text-gray-500 hover:bg-gray-100 p-1.5 rounded-lg transition" title="Batal"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button type="button" onClick={() => setEditServiceObj(service)} className="text-amber-500 hover:bg-amber-50 p-1.5 rounded-lg transition" title="Edit"><Edit size={16} /></button>
                                                    <button type="button" onClick={() => setDeleteServiceTarget(service)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition" title="Hapus"><Trash2 size={16} /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {servicesList.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-center py-8 text-gray-500">Belum ada data layanan.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const getLocalDateString = (dateStr: string) => {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHolidayDate || !newHolidayDesc) return;
        
        const existingHoliday = holidays.find(h => h.date && getLocalDateString(h.date) === newHolidayDate);
        if (existingHoliday) return;

        try {
            await apiService.addHoliday(newHolidayDate, newHolidayDesc);
            setNewHolidayDate('');
            setNewHolidayDesc('');
            setIsAddHolidayModalOpen(false);
            fetchData();
            setAlertModal({ show: true, title: 'Sukses', message: 'Hari libur berhasil ditambahkan.', type: 'success' });
        } catch (error: any) {
            setAlertModal({ show: true, title: 'Gagal', message: error.message || 'Gagal menambahkan hari libur', type: 'error' });
        }
    };

    const confirmDeleteHoliday = async () => {
        if (!deleteHolidayTarget) return;
        try {
            await apiService.deleteHoliday(deleteHolidayTarget.id);
            setDeleteHolidayTarget(null);
            fetchData();
            setAlertModal({ show: true, title: 'Sukses', message: 'Hari libur berhasil dihapus.', type: 'success' });
        } catch (error) {
            setAlertModal({ show: true, title: 'Gagal', message: 'Gagal menghapus hari libur', type: 'error' });
        }
    };

    const renderDeleteHolidayModal = () => {
        if (!deleteHolidayTarget) return null;
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Trash2 size={32} className="text-red-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Hapus Libur?</h2>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        Anda yakin ingin menghapus <b>{deleteHolidayTarget.description}</b> ({new Date(deleteHolidayTarget.date).toLocaleDateString('id-ID')})?
                    </p>
                    <div className="flex space-x-3">
                        <button onClick={() => setDeleteHolidayTarget(null)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition">Batal</button>
                        <button onClick={confirmDeleteHoliday} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-200">Ya, Hapus</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderAddHolidayModal = () => {
        if (!isAddHolidayModalOpen) return null;

        const isDuplicate = holidays.some(h => h.date && getLocalDateString(h.date) === newHolidayDate);

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                    <div className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
                        <h2 className="text-lg font-bold flex items-center"><Calendar size={18} className="mr-2"/> Tambah Libur</h2>
                        <button onClick={() => setIsAddHolidayModalOpen(false)} className="text-white hover:text-red-200 transition bg-white/10 hover:bg-white/20 rounded-full p-1"><X size={20} /></button>
                    </div>
                    <form onSubmit={handleAddHoliday} className="p-5 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                            <input type="date" required className={`w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500 ${isDuplicate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`} value={newHolidayDate} onChange={e => setNewHolidayDate(e.target.value)} />
                            {isDuplicate && <p className="text-red-500 text-xs mt-1">Tanggal libur ini sudah terdaftar.</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                            <input type="text" required placeholder="Cth: Idul Fitri" className="w-full border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500" value={newHolidayDesc} onChange={e => setNewHolidayDesc(e.target.value)} />
                        </div>
                        <div className="pt-4 flex justify-end">
                            <button type="submit" disabled={isDuplicate} className={`px-6 py-2.5 rounded-lg font-bold transition flex items-center shadow-lg ${isDuplicate ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'}`}>
                                <Save size={18} className="mr-2"/> Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const downloadHolidayTemplate = () => {
        const worksheet = XLSX.utils.aoa_to_sheet([
            ['TANGGAL', 'KETERANGAN'],
            ['2026-08-17', 'Hari Kemerdekaan RI'],
            ['2026-08-18', 'Cuti Bersama HUT RI']
        ]);

        const range = XLSX.utils.decode_range('A1:B25');
        
        // Freeze pan (1st row)
        worksheet['!views'] = [{ state: 'frozen', ySplit: 1 }];

        const borderStyle = {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
        };

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = {c: C, r: R};
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (!worksheet[cell_ref]) {
                    worksheet[cell_ref] = { t: 's', v: '' };
                }
                
                worksheet[cell_ref].s = {
                    border: borderStyle
                };

                if (R === 0) {
                    worksheet[cell_ref].s = {
                        ...worksheet[cell_ref].s,
                        fill: { fgColor: { rgb: "00B0F0" } },
                        font: { bold: true, color: { rgb: "000000" } }
                    };
                }
            }
        }
        worksheet['!cols'] = [{ wch: 15 }, { wch: 40 }];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Hari_Libur');
        XLSX.writeFile(workbook, 'Template_Hari_Libur.xlsx');
    };

    const handleImportHolidays = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const wsname = workbook.SheetNames[0];
                const ws = workbook.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws) as any[];

                let successCount = 0;
                let errorCount = 0;

                for (const row of data) {
                    const tgl = row['TANGGAL'];
                    const ket = row['KETERANGAN'];

                    if (tgl && ket) {
                        try {
                            // Format date handling
                            let finalDate = tgl;
                            if (typeof tgl === 'number') {
                                const d = new Date(Math.round((tgl - 25569) * 86400 * 1000));
                                finalDate = d.toISOString().split('T')[0];
                            } else {
                                finalDate = new Date(tgl).toISOString().split('T')[0];
                            }
                            await apiService.addHoliday(finalDate, ket);
                            successCount++;
                        } catch (err) {
                            errorCount++;
                        }
                    }
                }
                
                fetchData();
                setAlertModal({ 
                    show: true, 
                    title: 'Import Selesai', 
                    message: `Berhasil mengimpor ${successCount} hari libur. Gagal/Duplikat: ${errorCount}.`, 
                    type: 'success' 
                });
            } catch (error) {
                setAlertModal({ show: true, title: 'Error', message: 'Gagal membaca file Excel', type: 'error' });
            }
        };
        reader.readAsBinaryString(file);
        // Reset file input
        e.target.value = '';
    };

    const renderManageHolidays = () => {
        if (view !== 'holidays') return null;
        return (
            <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0 ${view === 'holidays' ? '' : 'mt-6'}`}>
                <div className="shrink-0 p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center">
                            <Calendar className="mr-2 text-blue-600" /> Tanggal Merah & Cuti Bersama
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Kelola daftar hari libur yang akan dikecualikan dari durasi cuti.</p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end mt-4 md:mt-0">
                        <button type="button" onClick={downloadHolidayTemplate} className="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 font-bold shadow-md shadow-emerald-200 transition flex items-center whitespace-nowrap text-sm">
                            <Download size={16} className="mr-2" /> Template
                        </button>
                        <label className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 font-bold shadow-md shadow-indigo-200 transition flex items-center whitespace-nowrap cursor-pointer text-sm">
                            <Upload size={16} className="mr-2" /> Import
                            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportHolidays} />
                        </label>
                        <button type="button" onClick={() => setIsAddHolidayModalOpen(true)} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 font-bold shadow-md shadow-blue-200 transition flex items-center whitespace-nowrap text-sm">
                            <PlusSquare size={16} className="mr-2" /> Tambah
                        </button>
                    </div>
                </div>
                <div className="p-0 flex-1 overflow-hidden flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto w-full">
                        <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-400 uppercase">
                                <tr>
                                    <th className="px-4 py-2.5 font-bold sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">No</th>
                                    <th className="px-4 py-2.5 font-bold sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">Tanggal</th>
                                    <th className="px-4 py-2.5 font-bold sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">Keterangan</th>
                                    <th className="px-4 py-2.5 text-center font-bold sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {([...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())).map((holiday, index) => (
                                    <tr key={holiday.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-2.5 font-medium">{index + 1}</td>
                                        <td className="px-4 py-2.5 font-bold text-gray-800">{new Date(holiday.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td>
                                        <td className="px-4 py-2.5">{holiday.description}</td>
                                        <td className="px-4 py-2.5 text-center">
                                            <button type="button" onClick={() => setDeleteHolidayTarget(holiday)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition" title="Hapus"><Trash2 size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {holidays.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-gray-500">Belum ada data hari libur.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`animate-fade-in ${['holidays', 'services', 'dashboard'].includes(view) ? 'flex flex-col h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)] overflow-hidden space-y-4' : 'space-y-4 pb-10'}`}>
            {/* ... Header ... */}
            <div className={`shrink-0 relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl px-6 py-5 text-white shadow-md overflow-hidden ${view === 'dashboard' ? 'mb-2' : ''}`}>
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold mb-1">Halo, {user?.name}!</h1>
                    <p className="text-sm text-blue-100 opacity-90">Selamat datang di E-Cuti.</p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4 translate-x-1/4"><Calendar size={200} /></div>
            </div>
            {renderManageServices()}
            {renderManageHolidays()}
            {view === 'dashboard' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="shrink-0">
                        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-1">Ringkasan Karyawan</h2>
                            <div className="flex items-center text-sm text-gray-500">
                                <span className="mr-2">Tampilkan</span>
                                <select
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={1000000000}>All</option>
                                </select>
                                <span className="ml-2">data</span>
                            </div>
                        </div>
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input type="text" placeholder="Cari by Nama, Email, Layanan..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition text-sm" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                        </div>
                    </div>
                    </div>
                    <div className="flex-1 overflow-y-auto w-full relative">
                        <table className="w-full text-left border-collapse">
                            <thead className="text-gray-600 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-2.5 cursor-pointer hover:bg-gray-100 transition select-none sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100" onClick={() => setSortNameAsc(prev => prev === null ? true : prev === true ? false : null)}>
                                        <div className="flex items-center">
                                            Nama {sortNameAsc === true ? '↑' : sortNameAsc === false ? '↓' : ''}
                                        </div>
                                    </th>
                                    <th className="px-6 py-2.5 sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">
                                        <div className="flex items-center">
                                            <span>Layanan</span>
                                            <select 
                                                className="ml-2 border border-gray-300 bg-white rounded px-1 py-0.5 text-xs font-normal focus:outline-none"
                                                value={filterService}
                                                onChange={(e) => setFilterService(e.target.value)}
                                            >
                                                <option value="All">All</option>
                                                {servicesList.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </th>
                                    <th className="px-6 py-2.5 text-center sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">Sisa Cuti</th>
                                    <th className="px-6 py-2.5 text-center text-amber-600 bg-amber-50 sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">Pending</th>
                                    <th className="px-6 py-2.5 text-center text-green-600 bg-green-50 sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">Approved</th>
                                    <th className="px-6 py-2.5 text-center text-red-600 bg-red-50 sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">Rejected</th>
                                    <th className="px-6 py-2.5 text-center sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">Dokumen</th>
                                    <th className="px-6 py-2.5 text-center sticky top-0 bg-gray-50 z-20 shadow-sm border-b border-gray-100">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {loading ? <tr><td colSpan={8} className="text-center py-8">Memuat data...</td></tr> :
                                    paginatedUsers.map((u) => {
                                        const stats = getUserStats(u.email);
                                        return (
                                            <tr key={u.email} className="hover:bg-gray-50 transition group">
                                                <td className="px-6 py-2.5">
                                                    <div className="font-bold text-gray-800">{u.name}</div>
                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                </td>
                                                <td className="px-6 py-2.5 text-gray-600">{u.service || '-'}</td>
                                                <td className="px-6 py-2.5 text-center font-bold text-gray-800">{u.balance}</td>
                                                <td className="px-6 py-2.5 text-center font-bold text-amber-600 bg-amber-50/30">{stats.pending}</td>
                                                <td className="px-6 py-2.5 text-center font-bold text-green-600 bg-green-50/30">{stats.approved}</td>
                                                <td className="px-6 py-2.5 text-center font-bold text-red-600 bg-red-50/30">{stats.rejected}</td>
                                                <td className="px-6 py-2.5 text-center">
                                                    <button onClick={() => setSelectedUserForDoc(u)} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-bold hover:bg-purple-100 inline-flex items-center justify-center border border-purple-100 tooltip-trigger" title="Lihat Dokumen Cuti">
                                                        <FolderOpen size={14} /> <span className="ml-1">Lihat Dokumen</span>
                                                    </button>
                                                </td>
                                                <td className="px-6 py-2.5">
                                                    <div className="flex items-center justify-center space-x-3">
                                                        <button onClick={() => setDetailUser(u)} className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition tooltip-trigger" title="Lihat Detail"><Eye size={16} /></button>
                                                        <button onClick={() => openEditModal(u)} className="text-amber-500 hover:text-amber-700 p-1.5 hover:bg-amber-50 rounded-lg transition" title="Edit Data"><Edit size={16} /></button>
                                                        <button onClick={() => setDeleteTarget(u)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition" title="Hapus User"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                }
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
                        <span className="text-sm text-gray-500">Hal {currentPage} dari {totalPages}</span>
                        <div className="flex space-x-2">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 flex items-center"><ChevronLeft size={16} /><span className="ml-1 hidden md:inline">Prev</span></button>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 flex items-center"><span className="mr-1 hidden md:inline">Next</span><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>
            )}
            {renderAddUserModal()}
            {renderExportModal()}
            {renderImportModal()}
            {renderDocumentModal()}
            {renderDetailModal()}
            {renderEditModal()}
            {renderDeleteModal()}
            {renderDeleteServiceModal()}
            {renderAddHolidayModal()}
            {renderDeleteHolidayModal()}
            {renderAlertModal()}
            {renderHistoryModal()}
        </div>
    );
};