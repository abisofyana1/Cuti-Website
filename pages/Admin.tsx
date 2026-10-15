import React, { useEffect, useState } from 'react';
import { ShieldCheck, Download, FileText, Table } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';

export const Admin: React.FC = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3002/api/leaves')
      .then(res => res.json())
      .then(data => {
        // If paginated response
        if (data.data && Array.isArray(data.data)) {
          setLeaves(data.data);
        } else if (Array.isArray(data)) {
          setLeaves(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch leaves:", err);
        setLoading(false);
      });
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Laporan Data Cuti Karyawan", 14, 15);
    
    const tableColumn = ["ID", "Nama", "Layanan", "Mulai", "Selesai", "Hari", "Status", "Alasan"];
    const tableRows: any[] = [];

    leaves.forEach(l => {
      const rowData = [
        l.id,
        l.userName,
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

  const exportExcel = () => {
    const wsData = [
      ["ID", "Nama", "Layanan", "Mulai", "Selesai", "Total Hari", "Status", "Alasan"]
    ];

    leaves.forEach(l => {
      wsData.push([
        l.id,
        l.userName,
        l.service,
        new Date(l.startDate).toLocaleDateString('id-ID'),
        new Date(l.endDate).toLocaleDateString('id-ID'),
        l.totalDays,
        l.status,
        l.reason
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Style the header
    const range = XLSX.utils.decode_range(ws['!ref'] || "A1:H1");
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
    XLSX.writeFile(wb, `Laporan_Cuti_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Panel Administrator</h2>
            <p className="text-sm text-gray-500">Pusat laporan dan ekspor data cuti</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={exportExcel}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Table size={18} />
            <span>Ekspor Excel</span>
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            <FileText size={18} />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Semua Data Cuti ({leaves.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
              <tr>
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Layanan</th>
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Memuat data...</td></tr>
              ) : leaves.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Tidak ada data cuti.</td></tr>
              ) : (
                leaves.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{l.userName}</td>
                    <td className="px-6 py-4">{l.service}</td>
                    <td className="px-6 py-4">{new Date(l.startDate).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        l.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        l.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
