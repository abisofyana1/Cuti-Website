export type Role = 'User' | 'TL' | 'SPV' | 'MGR' | 'Admin';

export interface User {
  email: string;
  password?: string;
  name: string;
  role: Role;
  balance: number;
  position: string;
  vendor: string;
  hq: string;
  service: string;
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
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}