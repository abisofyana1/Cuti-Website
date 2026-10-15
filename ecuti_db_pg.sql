-- PostgreSQL migration for ecuti_db

DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO services (name) VALUES 
('CX DIGITAL'), 
('CX EXCELLENCE'), 
('CX MANAJEMEN'), 
('CX PROTECTION');

CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    balance INTEGER DEFAULT 12,
    position VARCHAR(100),
    vendor VARCHAR(100),
    service VARCHAR(100),
    tl_email VARCHAR(255),
    spv_email VARCHAR(255),
    mgr_email VARCHAR(255)
);

CREATE TABLE leave_requests (
    id VARCHAR(50) PRIMARY KEY,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    service VARCHAR(100),
    start_date DATE,
    end_date DATE,
    total_days INTEGER,
    reason TEXT,
    status VARCHAR(50),
    current_position VARCHAR(50),
    approver_tl VARCHAR(255),
    approver_spv VARCHAR(255),
    approver_mgr VARCHAR(255),
    history JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data for users
INSERT INTO users (email, password, name, role, balance, position, vendor, service, tl_email, spv_email, mgr_email) VALUES
('Abi.Sofyana@bni.co.id', '96381', 'Abi Sofyana', 'User', 12, 'ASST ADM (TAD)', 'PT. SGRS', 'CX EXCELLENCE', 'tlcxe@bni.co.id', 'Muhammad.Dwiki@bni.co.id', NULL),
('admin@bni.co.id', 'admin', 'Administrator', 'Admin', 12, 'Administrator', '', '', NULL, NULL, NULL),
('Desi.Anugrahsari@bni.co.id', '95602', 'Desi Anugrah Sari', 'User', 12, 'ASST ADM (TAD)', 'PT. SGRS', 'CX EXCELLENCE', '-', 'Hary.Wibowo@bni.co.id', '-'),
('Fadli.TriSaputra@bni.co.id', '90874', 'Fadli Tri Saputra Ramli', 'User', 12, 'ASST ADM (TAD)', 'PT. SGRS', 'CX EXCELLENCE', '-', 'Hary.Wibowo@bni.co.id', '-'),
('Hary.Wibowo@bni.co.id', '35074', 'Muhammad Hary Wibowo', 'SPV', 12, 'Supervisor', '-', 'CX EXCELLENCE', '-', '-', '-'),
('Isma.Reslani@bni.co.id', '100026', 'Isma Reslani', 'User', 12, 'ASST ADM (TAD)', 'PT. SGRS', 'CX EXCELLENCE', '-', 'Hary.Wibowo@bni.co.id', '-'),
('M.Azhar@bni.co.id', '100026', 'Muhammad Al Azhar', 'User', 12, 'ASST ADM (TAD)', 'PT. SGRS', 'CX EXCELLENCE', '-', 'Hary.Wibowo@bni.co.id', '-'),
('Marylin.Widya@bni.co.id', '90927', 'Marylin Widya', 'User', 12, 'ASST ADM (TAD)', 'PT. SGRS', 'CX EXCELLENCE', '-', 'Hary.Wibowo@bni.co.id', '-'),
('Muhammad.Dwiki@bni.co.id', '63862', 'Muhammad Dwiki', 'SPV', 12, 'Supervisor', 'PT. VALDO', 'CX EXCELLENCE', NULL, NULL, NULL),
('tlcxe@bni.co.id', 'tl', 'TL CXE', 'TL', 12, 'TL (TAD)', 'PT. SGRS', 'CX EXCELLENCE', NULL, 'Muhammad.Dwiki@bni.co.id', NULL);



CREATE TABLE IF NOT EXISTS balance_history (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    proof_file VARCHAR(255),
    admin_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

