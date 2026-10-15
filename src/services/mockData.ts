import { User, LeaveRequest, Service, Holiday } from '../types';

export const MOCK_USERS: User[] = [
  {
    email: 'user@ecuti.com',
    password: '123',
    name: 'User Demo (Karyawan)',
    role: 'User',
    balance: 12,
    position: 'Staff Administrasi',
    vendor: 'PT. Demo Mitra',
    service: 'CX DIGITAL',
    hq: '12345',
    tlEmail: 'tl@ecuti.com',
    spvEmail: 'spv@ecuti.com',
    mgrEmail: 'mgr@ecuti.com'
  },
  {
    email: 'tl@ecuti.com',
    password: '123',
    name: 'Budi Team Leader',
    role: 'TL',
    balance: 12,
    position: 'Team Leader',
    vendor: 'PT. Demo Mitra',
    service: 'CX DIGITAL',
    spvEmail: 'spv@ecuti.com',
    mgrEmail: 'mgr@ecuti.com'
  },
  {
    email: 'spv@ecuti.com',
    password: '123',
    name: 'Siti Supervisor',
    role: 'SPV',
    balance: 12,
    position: 'Supervisor',
    vendor: 'PT. Demo Mitra',
    service: 'CX DIGITAL',
    mgrEmail: 'mgr@ecuti.com'
  },
  {
    email: 'mgr@ecuti.com',
    password: '123',
    name: 'Ahmad Manager',
    role: 'MGR',
    balance: 12,
    position: 'Manager',
    vendor: 'Internal',
    service: 'CX DIGITAL'
  },
  {
    email: 'admin@ecuti.com',
    password: 'admin',
    name: 'Administrator',
    role: 'Admin',
    balance: 12,
    position: 'Administrator',
    vendor: 'Internal',
    service: 'IT'
  }
];

export const MOCK_SERVICES: Service[] = [
  { id: 1, name: 'CX DIGITAL' },
  { id: 2, name: 'CX EXCELLENCE' },
  { id: 3, name: 'CX MANAJEMEN' },
  { id: 4, name: 'CX PROTECTION' }
];

export const MOCK_LEAVES: LeaveRequest[] = [
  {
    id: 'CT-DEMO-001',
    userEmail: 'user@ecuti.com',
    userName: 'User Demo (Karyawan)',
    service: 'CX DIGITAL',
    startDate: '2026-10-20',
    endDate: '2026-10-21',
    totalDays: 2,
    reason: 'Keperluan Keluarga',
    status: 'PENDING',
    currentPosition: 'TL',
    approverTL: 'tl@ecuti.com',
    approverSPV: 'spv@ecuti.com',
    approverMGR: 'mgr@ecuti.com',
    createdAt: new Date().toISOString(),
    history: [
      {
        stage: 'User',
        actor: 'User Demo (Karyawan)',
        action: 'SUBMIT',
        timestamp: new Date().toISOString()
      }
    ]
  },
  {
    id: 'CT-DEMO-002',
    userEmail: 'user@ecuti.com',
    userName: 'User Demo (Karyawan)',
    service: 'CX DIGITAL',
    startDate: '2026-08-10',
    endDate: '2026-08-11',
    totalDays: 2,
    reason: 'Cuti Tahunan Liburan',
    status: 'APPROVED',
    currentPosition: 'Admin',
    approverTL: 'tl@ecuti.com',
    approverSPV: 'spv@ecuti.com',
    approverMGR: 'mgr@ecuti.com',
    createdAt: '2026-08-01T08:00:00.000Z',
    history: [
      {
        stage: 'User',
        actor: 'User Demo (Karyawan)',
        action: 'SUBMIT',
        timestamp: '2026-08-01T08:00:00.000Z'
      },
      {
        stage: 'TL',
        actor: 'Budi Team Leader',
        action: 'APPROVE',
        timestamp: '2026-08-01T09:00:00.000Z'
      },
      {
        stage: 'SPV',
        actor: 'Siti Supervisor',
        action: 'APPROVE',
        timestamp: '2026-08-01T10:00:00.000Z'
      }
    ]
  }
];

export const MOCK_HOLIDAYS: Holiday[] = [
  { id: 1, date: '2026-01-01', description: 'Tahun Baru 2026 Masehi' },
  { id: 2, date: '2026-05-01', description: 'Hari Buruh Internasional' },
  { id: 3, date: '2026-08-17', description: 'Hari Kemerdekaan RI' },
  { id: 4, date: '2026-12-25', description: 'Hari Raya Natal' }
];
