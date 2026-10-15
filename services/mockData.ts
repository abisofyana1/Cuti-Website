import { User, LeaveRequest } from '../types';

// Mock Database
export const MOCK_USERS: User[] = [
  {
    email: 'admin@ecuti.com',
    password: '123',
    name: 'System Admin',
    role: 'Admin',
    balance: 12,
    position: 'Administrator',
    vendor: 'Internal',
    service: 'IT',
  },
  {
    email: 'mgr@ecuti.com',
    password: '123',
    name: 'Budi Manager',
    role: 'MGR',
    balance: 12,
    position: 'MGR',
    vendor: 'PT. SWADHARMA GRIYASATYA',
    service: 'CX MANAJEMEN',
  },
  {
    email: 'spv@ecuti.com',
    password: '123',
    name: 'Siti Supervisor',
    role: 'SPV',
    balance: 12,
    position: 'SPV',
    vendor: 'PT. SWADHARMA GRIYASATYA',
    service: 'CX MANAJEMEN',
    mgrEmail: 'mgr@ecuti.com',
  },
  {
    email: 'tl@ecuti.com',
    password: '123',
    name: 'Tono Team Leader',
    role: 'TL',
    balance: 10,
    position: 'TL - (TAD)',
    vendor: 'PT. SWADHARMA GRIYASATYA',
    service: 'CX DIGITAL',
    spvEmail: 'spv@ecuti.com',
    mgrEmail: 'mgr@ecuti.com',
  },
  {
    email: 'staff@ecuti.com',
    password: '123',
    name: 'Andi Staff',
    role: 'User',
    balance: 5,
    position: 'ASST ADM (TAD)',
    vendor: 'PT. VALDO',
    service: 'CX DIGITAL',
    tlEmail: 'tl@ecuti.com',
    spvEmail: 'spv@ecuti.com',
    mgrEmail: 'mgr@ecuti.com',
  }
];

export const MOCK_LEAVES: LeaveRequest[] = [
  {
    id: 'CT-1701234567890',
    userEmail: 'staff@ecuti.com',
    userName: 'Andi Staff',
    service: 'CX DIGITAL',
    startDate: '2023-12-01',
    endDate: '2023-12-02',
    totalDays: 2,
    reason: 'Sakit Demam',
    status: 'APPROVED',
    currentPosition: 'MGR',
    approverTL: 'tl@ecuti.com',
    approverSPV: 'spv@ecuti.com',
    approverMGR: 'mgr@ecuti.com',
    createdAt: new Date().toISOString(),
    history: [
      { stage: 'User', actor: 'Andi Staff', action: 'SUBMIT', timestamp: new Date().toISOString() }
    ]
  },
  {
    id: 'CT-1709876543210',
    userEmail: 'tl@ecuti.com',
    userName: 'Tono Team Leader',
    service: 'CX DIGITAL',
    startDate: '2023-12-10',
    endDate: '2023-12-11',
    totalDays: 2,
    reason: 'Acara Keluarga',
    status: 'PENDING',
    currentPosition: 'SPV',
    approverSPV: 'spv@ecuti.com',
    approverMGR: 'mgr@ecuti.com',
    createdAt: new Date().toISOString(),
    history: [
       { stage: 'TL', actor: 'Tono Team Leader', action: 'SUBMIT', timestamp: new Date().toISOString() }
    ]
  }
];