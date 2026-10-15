import { User, LeaveRequest, Service, Holiday } from '../types';

// Mengambil hostname dari browser (bisa localhost atau IP Address seperti 192.168.x.x)
// Backend sekarang berjalan di port 3002
const HOSTNAME = window.location.hostname;
const API_PORT = 3002;
const API_URL = `http://${HOSTNAME}:${API_PORT}/api`;

export const apiService = {
  login: async (email: string, pass: string): Promise<User> => {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });

    if (!res.ok) {
      // Coba baca pesan error dari JSON response server
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Login gagal. Periksa koneksi server.");
    }
    return res.json();
  },

  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_URL}/users`);
    if (!res.ok) throw new Error("Gagal mengambil data user");
    return res.json();
  },

  addUser: async (user: User): Promise<void> => {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error("Gagal menambah user");
  },

  updateUser: async (email: string, user: Partial<User>): Promise<void> => {
    const res = await fetch(`${API_URL}/users/${email}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!res.ok) throw new Error("Gagal mengupdate user");
  },

  getLeaves: async (): Promise<LeaveRequest[]> => {
    const res = await fetch(`${API_URL}/leaves`);
    if (!res.ok) throw new Error("Gagal mengambil data cuti");
    return res.json();
  },

  getLeavesPaged: async (params: { page: number; limit: number; search?: string; approver?: string; userEmail?: string }): Promise<{ data: LeaveRequest[]; pagination: any }> => {
    const query = new URLSearchParams();
    query.append('page', params.page.toString());
    query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    if (params.approver) query.append('approver', params.approver);
    if (params.userEmail) query.append('userEmail', params.userEmail);

    const res = await fetch(`${API_URL}/leaves?${query.toString()}`);
    if (!res.ok) throw new Error("Gagal mengambil data cuti paginate");
    return res.json();
  },

  addLeave: async (leave: LeaveRequest): Promise<void> => {
    const res = await fetch(`${API_URL}/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leave),
    });
    if (!res.ok) throw new Error("Gagal mengirim pengajuan");
  },

  updateLeave: async (leave: LeaveRequest): Promise<void> => {
    const res = await fetch(`${API_URL}/leaves/${leave.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: leave.status,
        currentPosition: leave.currentPosition,
        history: leave.history
      }),
    });
    if (!res.ok) throw new Error("Gagal mengupdate pengajuan");
  },

  deleteUser: async (email: string): Promise<void> => {
    const res = await fetch(`${API_URL}/users/${email}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error("Gagal menghapus user");
  },

  uploadProof: async (formData: FormData): Promise<{ filename: string; path: string }> => {
    const res = await fetch(`${API_URL}/upload-proof`, {
      method: 'POST',
      body: formData, // Content-Type header is automatically set by browser for FormData
    });
    if (!res.ok) throw new Error("Gagal mengupload bukti");
    return res.json();
  },

  getBalanceHistory: async (email: string): Promise<any[]> => {
    const res = await fetch(`${API_URL}/balance-history/${email}`);
    if (!res.ok) throw new Error("Gagal mengambil riwayat saldo");
    return res.json();
  },

  getServices: async (): Promise<Service[]> => {
    const res = await fetch(`${API_URL}/services`);
    if (!res.ok) throw new Error("Gagal mengambil data layanan");
    return res.json();
  },

  addService: async (name: string): Promise<Service> => {
    const res = await fetch(`${API_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menambah layanan");
    }
    return res.json();
  },

  updateService: async (id: number, name: string): Promise<Service> => {
    const res = await fetch(`${API_URL}/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal mengupdate layanan");
    }
    return res.json();
  },

  deleteService: async (id: number): Promise<void> => {
    const res = await fetch(`${API_URL}/services/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menghapus layanan");
    }
  },

  getHolidays: async (): Promise<Holiday[]> => {
    const res = await fetch(`${API_URL}/holidays`);
    if (!res.ok) throw new Error("Gagal mengambil data hari libur");
    return res.json();
  },

  addHoliday: async (date: string, description: string): Promise<Holiday> => {
    const res = await fetch(`${API_URL}/holidays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, description }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menambah hari libur");
    }
    return res.json();
  },

  deleteHoliday: async (id: number): Promise<void> => {
    const res = await fetch(`${API_URL}/holidays/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menghapus hari libur");
    }
  }
};