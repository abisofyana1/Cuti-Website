import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CUSTOM_SIGNATURE_BASE64 } from '../constants';
import { LeaveRequest, User } from '../types';

export const generateLeavePDF = (leave: LeaveRequest, targetUser: User, users: User[]) => {
    try {
        const doc = new jsPDF();

        doc.setTextColor(0, 0, 0);

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

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("PT. SWADHARMA GRIYASATYA", 14, 15);

        doc.setFontSize(14);
        doc.text("SURAT PERMOHONAN CUTI", 105, 30, { align: "center" });

        let submissionTimeStr = leave.createdAt;
        if (!submissionTimeStr || submissionTimeStr === '-' || new Date(submissionTimeStr).toString() === 'Invalid Date') {
            const submitHistory = leave.history?.find(h => h.action === 'SUBMIT');
            if (submitHistory) {
                submissionTimeStr = submitHistory.timestamp;
            }
        }
        const submissionTimestamp = formatDate(submissionTimeStr, 'short');

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
                fontSize: 11,
                textColor: [0, 0, 0], 
                cellPadding: 2, 
                lineColor: [0, 0, 0], 
                lineWidth: 0.5, 
                valign: 'middle',
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 50, fontStyle: 'normal', valign: 'top' }, 
                1: { valign: 'top' } 
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
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

        const drawStamp = (cx: number, cy: number, status: string, timestampStr: string) => {
            const r = 6; 
            const yCenter = cy + 12;

            let color = [150, 150, 150];

            if (status === 'APPROVED') {
                color = [34, 197, 94]; 
            } else if (status === 'REJECTED') {
                color = [239, 68, 68]; 
            } else if (status === 'PENDING') {
                color = [59, 130, 246]; 
            }

            doc.setFillColor(color[0], color[1], color[2]);
            doc.setDrawColor(color[0], color[1], color[2]);
            doc.circle(cx, yCenter, r, 'F');

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

            doc.setTextColor(color[0], color[1], color[2]);
            doc.setFontSize(9);
            doc.setFont("helvetica", "bolditalic");
            doc.text(status, cx, yCenter + r + 5, { align: 'center' });

            doc.setTextColor(0, 0, 0); 
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.text(timestampStr, cx, yCenter + r + 10, { align: 'center' });
        };

        const signSpaceY = sigY + 5;
        const imgSize = 15; 

        try {
            doc.addImage(CUSTOM_SIGNATURE_BASE64, 'PNG', col1X - (imgSize / 2), signSpaceY + 4.5, imgSize, imgSize);
        } catch (imgError) {
            console.error("Gagal memuat gambar tanda tangan", imgError);
            doc.setFontSize(8);
            doc.setTextColor(255, 0, 0);
            doc.text("[Gagal Muat Gambar]", col1X, signSpaceY + 10, { align: 'center' });
        }

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(submissionTimestamp, col1X, signSpaceY + 27, { align: 'center' });

        const nameY = signSpaceY + 32;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(targetUser.name, col1X, nameY, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
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
            doc.text("(TEAM LEADER)", col2X, nameY + 4, { align: 'center' });
        } else {
            doc.setFontSize(20);
            doc.setTextColor(0, 0, 0);
            doc.text("-", col2X, signSpaceY + 15, { align: 'center' });
        }

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
            doc.text(`(${approver2Role.toUpperCase()})`, col3X, nameY + 4, { align: 'center' });
        } else {
            doc.setFontSize(20);
            doc.setTextColor(0, 0, 0);
            doc.text("-", col3X, signSpaceY + 15, { align: 'center' });
        }

        doc.save(`Surat_Cuti_${targetUser.name}_${leave.startDate}.pdf`);

    } catch (err: any) {
        console.error("PDF Generation Error:", err);
        throw err;
    }
};
