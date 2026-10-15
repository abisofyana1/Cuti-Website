import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { LeaveRequest, User } from '../types';
import { Users, Calendar, CheckCircle, XCircle, Clock, FolderOpen, Search, ChevronLeft, ChevronRight, Minus, Circle, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CUSTOM_SIGNATURE_BASE64 } from '../constants';

export const TeamHistory: React.FC = () => {
    const { user } = useAuth();
    const [teamLeaves, setTeamLeaves] = useState<LeaveRequest[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [selectedUserForHistory, setSelectedUserForHistory] = useState<User | null>(null);
    const [balanceHistory, setBalanceHistory] = useState<any[]>([]);

    // Pagination & Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(() => {
        const savedPage = sessionStorage.getItem('teamHistory_currentPage');
        return savedPage ? Number(savedPage) : 1;
    });
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const savedItems = sessionStorage.getItem('teamHistory_itemsPerPage');
        return savedItems ? Number(savedItems) : 10;
    });
    const [totalPages, setTotalPages] = useState(1);

    // Save pagination state to session storage
    useEffect(() => {
        sessionStorage.setItem('teamHistory_currentPage', currentPage.toString());
        sessionStorage.setItem('teamHistory_itemsPerPage', itemsPerPage.toString());
    }, [currentPage, itemsPerPage]);

    const fetchTeamData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Get Users for mapping names/details if needed (though API might provide enough)
            const usersData = await apiService.getUsers();
            setAllUsers(usersData);

            // Fetch Paged Leaves
            const { data, pagination } = await apiService.getLeavesPaged({
                page: currentPage,
                limit: itemsPerPage,
                search: searchTerm,
                approver: user.email // Filter by current user as approver
            });

            setTeamLeaves(data);
            setTotalPages(pagination.totalPages);
        } catch (error) {
            console.error("Gagal mengambil riwayat tim", error);
        } finally {
            setLoading(false);
        }
    };

    // Debounced Search & Pagination Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTeamData();
        }, 500);
        return () => clearTimeout(timer);
    }, [user, currentPage, itemsPerPage, searchTerm]);

    // Reset to page 1 when search term changes (handled in input onChange traditionally, 
    // but here if we want to be safe we can explicit reset in the input handler)

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID');
    };

    // --- PDF GENERATOR LOGIC ---
    const generateLeavePDF = (leave: LeaveRequest) => {
        try {
            const targetUser = allUsers.find(u => u.email === leave.userEmail);
            if (!targetUser) {
                alert("Data user tidak ditemukan lengkap untuk PDF.");
                return;
            }

            const ddmmyyStr = new Date(leave.startDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
            const filename = `${targetUser.name.replace(/\s+/g, '_')}_Cuti_${ddmmyyStr}`;
            const doc = new jsPDF();
            doc.setProperties({ title: filename });

            // Set Default Color
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
                const u = allUsers.find(x => x.email === email);
                return u ? u.name : email;
            };
            const tlName = getApproverName(leave.approverTL);
            const spvName = getApproverName(leave.approverSPV);

            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("PT. SWADHARMA GRIYASATYA", 14, 15);

            doc.setFontSize(14);
            doc.text("SURAT PERMOHONAN CUTI", 105, 30, { align: "center" });

            // --- CRITICAL FIX FOR TIMESTAMP ---
            let submissionTimeStr = leave.createdAt;
            if (!submissionTimeStr || submissionTimeStr === '-' || new Date(submissionTimeStr).toString() === 'Invalid Date') {
                const submitHistory = leave.history?.find(h => h.action === 'SUBMIT');
                if (submitHistory) {
                    submissionTimeStr = submitHistory.timestamp;
                }
            }
            const submissionTimestamp = formatDate(submissionTimeStr, 'short');

            // [MODIFIED] Table Styling
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

            autoTable(doc, {
                startY: 40,
                body: tableData,
                theme: 'grid',
                styles: {
                    font: "helvetica",
                    fontSize: 11, // Larger font
                    textColor: [0, 0, 0], // Hitam Pekat
                    cellPadding: 2, // 2mm (~8px) results in ~22-24pt row height
                    lineColor: [0, 0, 0], // Black Border
                    lineWidth: 0.5, // Tegas/Bold Border
                    valign: 'middle',
                    overflow: 'linebreak'
                },
                columnStyles: {
                    0: { cellWidth: 50, fontStyle: 'normal', valign: 'top' }, // NORMAL style (No Bold)
                    1: { valign: 'top' }
                }
            });

            const finalY = (doc as any).lastAutoTable.finalY + 10;

            // 2. Tanggal Surat
            const letterDateStr = formatDate(submissionTimeStr, 'full');

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            doc.text(`Tangerang Selatan, ${letterDateStr}`, 195, finalY, { align: 'right' });

            const mengetahuiY = finalY + 20;

            doc.text("Mengetahui:", 14, mengetahuiY);
            doc.text("PT. BANK NEGARA INDONESIA (PERSERO) Tbk.", 14, mengetahuiY + 5);
            doc.text("DIVISI CUSTOMER EXPERIENCE CENTER", 14, mengetahuiY + 10);

            const sigY = mengetahuiY + 25;
            const col1X = 30;
            const col2X = 105;
            const col3X = 170;

            doc.setFont("helvetica", "bold");
            doc.text("Pemohon", col1X, sigY, { align: 'center' });
            doc.text("Approver 1", col2X, sigY, { align: 'center' });
            doc.text("Approver 2", col3X, sigY, { align: 'center' });

            // --- 3. DRAW STAMP ICON LOGIC (Vector) ---
            const drawStamp = (cx: number, cy: number, status: string, timestampStr: string) => {
                const r = 6;
                const yCenter = cy + 12;

                let color = [150, 150, 150];

                if (status === 'APPROVED') {
                    color = [34, 197, 94]; // Green
                } else if (status === 'REJECTED') {
                    color = [239, 68, 68]; // Red
                } else if (status === 'PENDING') {
                    color = [59, 130, 246]; // Blue
                }

                // Circle
                doc.setFillColor(color[0], color[1], color[2]);
                doc.setDrawColor(color[0], color[1], color[2]);
                doc.circle(cx, yCenter, r, 'F');

                // Icon
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

                // Label
                doc.setTextColor(color[0], color[1], color[2]);
                doc.setFontSize(9);
                doc.setFont("helvetica", "bolditalic");
                doc.text(status, cx, yCenter + r + 5, { align: 'center' });

                // Timestamp
                doc.setTextColor(0, 0, 0); // Black for readability
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.text(timestampStr, cx, yCenter + r + 10, { align: 'center' });
            };

            const signSpaceY = sigY + 5;

            // 4. Signature Pemohon
            const imgSize = 15;

            try {
                doc.addImage(CUSTOM_SIGNATURE_BASE64, 'PNG', col1X - (imgSize / 2), signSpaceY + 4.5, imgSize, imgSize);
            } catch (imgErr) {
                console.error("Gagal load gambar", imgErr);
                doc.setFontSize(8);
                doc.setTextColor(255, 0, 0);
                doc.text("[Image Error]", col1X, signSpaceY + 10, { align: 'center' });
            }

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(submissionTimestamp, col1X, signSpaceY + 27, { align: 'center' });

            // Nama Pemohon
            const nameY = signSpaceY + 32;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(targetUser.name, col1X, nameY, { align: 'center' });
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            // [MODIFIED] Uppercase Position
            doc.text(`(${targetUser.position})`, col1X, nameY + 4, { align: 'center' });

            const getApprovalInfo = (stage: string) => {
                const history = Array.isArray(leave.history) ? leave.history : [];
                const found = history.find((h: any) => h.stage === stage);
                if (found) {
                    return {
                        status: found.action,
                        date: formatDate(found.timestamp, 'short')
                    };
                }
                return null;
            };

            // 5. Approver 1 (TL)
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
                // [MODIFIED] Uppercase Position
                doc.text("(TEAM LEADER)", col2X, nameY + 4, { align: 'center' });
            } else {
                doc.setFontSize(20);
                doc.setTextColor(0, 0, 0);
                doc.text("-", col2X, signSpaceY + 15, { align: 'center' });
            }

            // 6. Approver 2 (SPV/MGR)
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
                // [MODIFIED] Uppercase Position
                doc.text(`(${approver2Role.toUpperCase()})`, col3X, nameY + 4, { align: 'center' });
            } else {
                doc.setFontSize(20);
                doc.setTextColor(0, 0, 0);
                doc.text("-", col3X, signSpaceY + 15, { align: 'center' });
            }

            // doc.save(`Surat_Cuti_${targetUser.name}_${leave.startDate}.pdf`);
            // doc.save is the most reliable way to ensure the filename is pre-filled in the Save As dialog
            doc.save(`${filename}.pdf`);

        } catch (e: any) {
            console.error("PDF Gen Error", e);
            alert(`Gagal membuat PDF. Error: ${e.message}`);
        }
    };

    const renderStatusIcons = (leave: LeaveRequest) => {
        const getStageStatus = (role: 'TL' | 'SPV' | 'MGR') => {
            const approverEmail = role === 'TL' ? leave.approverTL : (role === 'SPV' ? leave.approverSPV : leave.approverMGR);
            if (!approverEmail) return 'strip';
            const historyArray = Array.isArray(leave.history) ? leave.history : [];
            const historyItem = historyArray.find(h => h.stage === role);
            if (historyItem) {
                if (historyItem.action === 'APPROVE') return 'approved';
                if (historyItem.action === 'REJECT') return 'rejected';
            }
            if (leave.currentPosition === role && leave.status === 'PENDING') return 'pending';
            const rolesOrder = ['User', 'TL', 'SPV', 'MGR', 'Admin'];
            const currentIdx = rolesOrder.indexOf(leave.currentPosition);
            const roleIdx = rolesOrder.indexOf(role);
            if (currentIdx > roleIdx && leave.status !== 'REJECTED') return 'approved';
            if (leave.status === 'APPROVED') return 'approved';
            return 'waiting';
        };

        const renderIcon = (status: string, label: string) => {
            let icon = <Circle size={18} className="text-gray-200" />;
            let colorClass = "text-gray-400";
            if (status === 'approved') {
                icon = <CheckCircle size={18} />;
                colorClass = "text-green-500";
            } else if (status === 'rejected') {
                icon = <XCircle size={18} />;
                colorClass = "text-red-500";
            } else if (status === 'pending') {
                icon = <Clock size={18} className="animate-pulse" />;
                colorClass = "text-amber-500";
            } else if (status === 'strip') {
                icon = <Minus size={18} />;
                colorClass = "text-gray-300";
            }
            return (
                <div className={`flex flex-col items-center mx-2 ${colorClass}`} title={`${label}: ${status}`}>
                    {icon}
                    <span className="text-[10px] font-bold mt-1">{label}</span>
                </div>
            );
        };

        return (
            <div className="flex items-center justify-center">
                {renderIcon(getStageStatus('TL'), 'TL')}
                <div className="w-4 h-0.5 bg-gray-200"></div>
                {renderIcon(getStageStatus('SPV'), 'SPV')}
                <div className="w-4 h-0.5 bg-gray-200"></div>
                {renderIcon(getStageStatus('MGR'), 'MGR')}
            </div>
        );
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <span className="flex items-center justify-center text-green-600 bg-green-100 px-3 py-1 rounded-full text-xs font-bold w-full"><CheckCircle size={14} className="mr-1" /> Disetujui</span>;
            case 'REJECTED': return <span className="flex items-center justify-center text-red-600 bg-red-100 px-3 py-1 rounded-full text-xs font-bold w-full"><XCircle size={14} className="mr-1" /> Ditolak</span>;
            default: return <span className="flex items-center justify-center text-amber-600 bg-amber-100 px-3 py-1 rounded-full text-xs font-bold w-full"><Clock size={14} className="mr-1" /> Pending</span>;
        }
    };

    // --- MODAL LOGIC (Replicated from AdminPanel) ---

    const handleViewHistory = async (u: User) => {
        setSelectedUserForHistory(u);
        setBalanceHistory([]);
        try {
            const data = await apiService.getBalanceHistory(u.email);
            setBalanceHistory(data);
        } catch (error) {
            console.error(error);
            alert('Gagal memuat riwayat penambahan cuti.');
        }
    };



    const handleDownloadProof = async (url: string, userName: string, dateStr: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const d = new Date(dateStr);
            const ddmmyy = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
            const filename = `${userName.replace(/\s+/g, '_')}_Tambah Cuti_${ddmmyy}.pdf`;

            const objectUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(objectUrl);
        } catch (error) {
            console.error("Download failed", error);
            alert("Gagal mengunduh dokumen.");
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
                                <Clock className="text-orange-500" /> Riwayat Penambahan Cuti
                            </h3>
                            <p className="text-gray-500 font-medium text-sm mt-1">
                                {selectedUserForHistory.name} <span className="text-gray-400">({selectedUserForHistory.email})</span>
                            </p>
                        </div>
                        <button onClick={() => setSelectedUserForHistory(null)} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
                    </div>
                    <div className="p-0 bg-white overflow-y-auto flex-1">
                        {balanceHistory.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Clock size={30} className="text-gray-400" /></div>
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
                                                    <button
                                                        onClick={() => handleDownloadProof(`http://localhost:3002/uploads/${h.proofFile}`, selectedUserForHistory.name, h.createdAt)}
                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-xs font-bold hover:bg-blue-100 transition border border-blue-100"
                                                    >
                                                        <FileText size={14} className="mr-1" /> Unduh PDF
                                                    </button>
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



    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-1">
                            <div className="p-2 bg-purple-100 rounded-lg mr-3 text-purple-600"><Users size={24} /></div>
                            Riwayat Tim & Approval
                        </h2>
                        <div className="flex items-center text-sm text-gray-500 ml-12">
                            <span className="mr-2">Show</span>
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
                            <span className="ml-2">entries</span>
                        </div>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input
                            type="text"
                            title="Search Name, Service..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (currentPage !== 1) setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-3 w-1/4">Nama Karyawan</th>
                                <th className="px-6 py-3 w-1/4">Tanggal & Alasan</th>
                                <th className="px-6 py-3 text-center">Durasi</th>
                                <th className="px-6 py-3 text-center">Status Akhir</th>
                                <th className="px-6 py-3 text-center">Posisi Saat Ini</th>
                                <th className="px-6 py-3 text-center">Dokumen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-8">Memuat data...</td></tr>
                            ) : teamLeaves.length > 0 ? (
                                teamLeaves.map((l) => (
                                    <tr key={l.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 align-middle">
                                            <div className="font-bold text-gray-800">{l.userName}</div>
                                            <div className="text-xs text-gray-500">{l.service}</div>
                                        </td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex items-center text-gray-800 font-medium mb-1 whitespace-nowrap">
                                                <Calendar size={14} className="mr-2 text-blue-600" />
                                                {formatDate(l.startDate)} <span className="mx-1">-</span> {formatDate(l.endDate)}
                                            </div>
                                            <p className="text-gray-500 text-xs italic truncate max-w-[200px]" title={l.reason}>
                                                "{l.reason}"
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold align-middle">{l.totalDays} Hari</td>
                                        <td className="px-6 py-4 align-middle">
                                            <div className="flex flex-col items-center justify-center">
                                                {getStatusBadge(l.status)}
                                                {l.status === 'REJECTED' && l.history && l.history.find(h => h.action === 'REJECT' && h.comment) && (
                                                    <p className="text-[10px] text-red-500 mt-1 italic max-w-[120px] text-center break-words">
                                                        "{l.history.find(h => h.action === 'REJECT' && h.comment)?.comment}"
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 align-middle">{renderStatusIcons(l)}</td>
                                        <td className="px-6 py-4 text-center align-middle">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button onClick={() => {
                                                    const u = allUsers.find(u => u.email === l.userEmail);
                                                    if (u) handleViewHistory(u);
                                                }} className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition border border-orange-200" title="Riwayat Tambah Cuti">
                                                    <Clock size={16} />
                                                </button>
                                                <button onClick={() => generateLeavePDF(l)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition border border-blue-200" title="Unduh PDF">
                                                    <FileText size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">Belum ada riwayat tim.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION CONTROLS */}
                <div className="p-4 flex justify-between items-center border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages || 1}
                    </div>
                    <div className="flex space-x-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 flex items-center"
                        >
                            <ChevronLeft size={16} /><span className="ml-1 hidden md:inline">Prev</span>
                        </button>
                        <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 flex items-center"
                        >
                            <span className="mr-1 hidden md:inline">Next</span><ChevronRight size={16} />
                        </button>
                    </div>
                </div>

            </div>
            {renderHistoryModal()}
        </div>
    );
};