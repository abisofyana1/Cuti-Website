export type Role = 'User' | 'TL' | 'SPV' | 'MGR' | 'Admin';

export interface Service {
  id: number;
  name: string;
}

export interface User {
  email: string;
  password?: string;
  name: string;
  role: Role;
  balance: number;
  position: string;
  vendor: string;
  service: string;
  hq?: string;
  tlEmail?: string;
  spvEmail?: string;
  mgrEmail?: string;
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
  id: string;
  userEmail: string;
  userName: string;
  service: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  currentPosition: Role;
  approverTL?: string;
  approverSPV?: string;
  approverMGR?: string;
  createdAt: string;
  history: {
    stage: Role;
    actor: string;
    action: 'SUBMIT' | 'APPROVE' | 'REJECT';
    timestamp: string;
    comment?: string;
  }[];
}

export interface ActivityLog {
  id: number;
  timestamp: string;
  userName: string;
  userEmail: string;
  role: string;
  action: string;
  details: string;
}

export interface SystemError {
  id: number;
  timestamp: string;
  source: string;
  message: string;
  stackTrace?: string;
  solution?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean; // Property baru untuk status timeout
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  resetSessionStatus: () => void; // Reset status expired saat login ulang
}

export interface BalanceHistory {
  id: number;
  userEmail: string;
  amount: number;
  description: string;
  proofFile?: string;
  adminName: string;
  createdAt: string;
}

export interface Holiday {
  id: number;
  date: string;
  description: string;
}