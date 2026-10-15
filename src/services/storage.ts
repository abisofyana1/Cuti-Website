import { User, LeaveRequest } from '../types';

// Initial Mock Users
const INITIAL_USERS: User[] = [
  { email: 'admin@ecuti.com', password: '123', name: 'System Admin', role: 'Admin', balance: 12, position: 'Administrator', vendor: 'Internal', service: 'IT' },
  { email: 'mgr@ecuti.com', password: '123', name: 'Budi Manager', role: 'MGR', balance: 12, position: 'MGR', vendor: 'GRIYASATYA', service: 'CX MANAJEMEN' },
  { email: 'spv@ecuti.com', password: '123', name: 'Siti Supervisor', role: 'SPV', balance: 12, position: 'SPV', vendor: 'GRIYASATYA', service: 'CX MANAJEMEN', mgrEmail: 'mgr@ecuti.com' },
  { email: 'tl@ecuti.com', password: '123', name: 'Tono Team Leader', role: 'TL', balance: 10, position: 'TL', vendor: 'GRIYASATYA', service: 'CX DIGITAL', spvEmail: 'spv@ecuti.com', mgrEmail: 'mgr@ecuti.com' },
  { email: 'staff@ecuti.com', password: '123', name: 'Andi Staff', role: 'User', balance: 12, position: 'STAFF', vendor: 'VALDO', service: 'CX DIGITAL', tlEmail: 'tl@ecuti.com', spvEmail: 'spv@ecuti.com', mgrEmail: 'mgr@ecuti.com' }
];

const INITIAL_LEAVES: LeaveRequest[] = [
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
    history: [{ stage: 'User', actor: 'Andi Staff', action: 'SUBMIT', timestamp: new Date().toISOString() }]
  }
];

// Helper to initialize storage
const initStorage = () => {
  if (!localStorage.getItem('ecuti_users')) {
    localStorage.setItem('ecuti_users', JSON.stringify(INITIAL_USERS));
  }
  if (!localStorage.getItem('ecuti_leaves')) {
    localStorage.setItem('ecuti_leaves', JSON.stringify(INITIAL_LEAVES));
  }
};

export const storageService = {
  getUsers: (): User[] => {
    initStorage();
    return JSON.parse(localStorage.getItem('ecuti_users') || '[]');
  },
  
  getLeaves: (): LeaveRequest[] => {
    initStorage();
    return JSON.parse(localStorage.getItem('ecuti_leaves') || '[]');
  },

  addLeave: (leave: LeaveRequest) => {
    const leaves = storageService.getLeaves();
    leaves.unshift(leave); // Add to top
    localStorage.setItem('ecuti_leaves', JSON.stringify(leaves));
    
    // Decrease balance
    const users = storageService.getUsers();
    const userIdx = users.findIndex(u => u.email === leave.userEmail);
    if (userIdx >= 0) {
      users[userIdx].balance -= leave.totalDays;
      localStorage.setItem('ecuti_users', JSON.stringify(users));
    }
  },

  updateLeave: (updatedLeave: LeaveRequest) => {
    const leaves = storageService.getLeaves();
    const idx = leaves.findIndex(l => l.id === updatedLeave.id);
    if (idx >= 0) {
      leaves[idx] = updatedLeave;
      localStorage.setItem('ecuti_leaves', JSON.stringify(leaves));
    }
  },
  
  // Refresh current user data (in case balance changed)
  getCurrentUser: (email: string): User | undefined => {
    const users = storageService.getUsers();
    return users.find(u => u.email === email);
  }
};