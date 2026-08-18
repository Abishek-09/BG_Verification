-- =====================================================================
-- Background Verification System - PostgreSQL Database Schema
-- Entities: Person, Department, Roles, Person_Department, Person_Roles, Person_Details
-- =====================================================================

-- Enable UUID extension if UUID primary keys are preferred
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Optional: Custom Status Enum Type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'record_status') THEN
        CREATE TYPE record_status AS ENUM ('active', 'inactive', 'pending', 'verified', 'archived');
    END IF;
END$$;

-- Drop Tables (in reverse dependency order)
DROP TABLE IF EXISTS person_details CASCADE;
DROP TABLE IF EXISTS person_roles CASCADE;
DROP TABLE IF EXISTS person_department CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS department CASCADE;
DROP TABLE IF EXISTS person CASCADE;

-- ---------------------------------------------------------------------
-- 1. PERSON TABLE
-- Stores primary employee / individual demographics
-- ---------------------------------------------------------------------
CREATE TABLE person (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    email       VARCHAR(255) NOT NULL UNIQUE,
    status      VARCHAR(50)  NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. DEPARTMENT TABLE
-- Stores organizational units / departments
-- ---------------------------------------------------------------------
CREATE TABLE department (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL UNIQUE,
    status      VARCHAR(50)  NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 3. ROLES TABLE
-- Stores job roles, designations, and security privileges
-- ---------------------------------------------------------------------
CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL UNIQUE,
    status      VARCHAR(50)  NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 4. PERSON_DEPARTMENT TABLE (Junction Table: Person <-> Department)
-- Maps persons to one or multiple departments with status tracking
-- ---------------------------------------------------------------------
CREATE TABLE person_department (
    id            BIGSERIAL PRIMARY KEY,
    person_id     BIGINT      NOT NULL REFERENCES person(id) ON DELETE CASCADE ON UPDATE CASCADE,
    department_id BIGINT      NOT NULL REFERENCES department(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    status        VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_person_department UNIQUE (person_id, department_id)
);

-- ---------------------------------------------------------------------
-- 5. PERSON_ROLES TABLE (Junction Table: Person <-> Roles)
-- Maps persons to one or multiple designations/roles with status tracking
-- ---------------------------------------------------------------------
CREATE TABLE person_roles (
    id          BIGSERIAL PRIMARY KEY,
    person_id   BIGINT      NOT NULL REFERENCES person(id) ON DELETE CASCADE ON UPDATE CASCADE,
    role_id     BIGINT      NOT NULL REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    status      VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_person_roles UNIQUE (person_id, role_id)
);

-- ---------------------------------------------------------------------
-- 6. PERSON_DETAILS TABLE
-- Stores detailed verification, mobile, company, experience, and salary information
-- ---------------------------------------------------------------------
CREATE TABLE person_details (
    id                BIGSERIAL PRIMARY KEY,
    person_id         BIGINT       NOT NULL REFERENCES person(id) ON DELETE CASCADE ON UPDATE CASCADE,
    mobile            VARCHAR(20),
    company_name      VARCHAR(150),
    barcode_data      TEXT,
    monthly_salary    NUMERIC(12, 2),
    total_experience  VARCHAR(50),
    start_date        DATE,
    end_date          DATE,
    person_dept_id    BIGINT       REFERENCES person_department(id) ON DELETE SET NULL ON UPDATE CASCADE,
    person_role_id    BIGINT       REFERENCES person_roles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    employee_code     VARCHAR(50),
    company_address   TEXT,
    person_address    TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status            VARCHAR(50)  NOT NULL DEFAULT 'active',
    remarks           TEXT,
    payment_slip      TEXT,
    photo_url         TEXT
);

-- =====================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================================
CREATE INDEX idx_person_email ON person(email);
CREATE INDEX idx_person_status ON person(status);

CREATE INDEX idx_department_status ON department(status);
CREATE INDEX idx_roles_status ON roles(status);

CREATE INDEX idx_person_dept_person_id ON person_department(person_id);
CREATE INDEX idx_person_dept_dept_id ON person_department(department_id);
CREATE INDEX idx_person_dept_status ON person_department(status);

CREATE INDEX idx_person_roles_person_id ON person_roles(person_id);
CREATE INDEX idx_person_roles_role_id ON person_roles(role_id);
CREATE INDEX idx_person_roles_status ON person_roles(status);

CREATE INDEX idx_person_details_person_id ON person_details(person_id);
CREATE INDEX idx_person_details_emp_code ON person_details(employee_code);
CREATE INDEX idx_person_details_status ON person_details(status);

-- =====================================================================
-- SAMPLE SEED DATA
-- =====================================================================

-- Insert Departments
INSERT INTO department (name, status) VALUES
('Software Engineering', 'active'),
('Product & Design', 'active'),
('Cloud Infrastructure & DevOps', 'active'),
('Human Resources', 'active');

-- Insert Roles
INSERT INTO roles (name, status) VALUES
('Lead Frontend Developer', 'active'),
('UI/UX Developer', 'active'),
('DevOps & Systems Architect', 'active'),
('HR Specialist', 'active');

-- Insert Persons
INSERT INTO person (name, email, status) VALUES
('Sarah Jenkins', 'sarah.jenkins@techcorp.io', 'verified'),
('Alexander Vance', 'alex.vance@innovate.com', 'verified');

-- Assign Person to Department
INSERT INTO person_department (person_id, department_id, status) VALUES
(1, 1, 'active'), -- Sarah Jenkins -> Software Engineering
(2, 3, 'active'); -- Alexander Vance -> Cloud Infrastructure

-- Assign Person to Roles
INSERT INTO person_roles (person_id, role_id, status) VALUES
(1, 1, 'active'), -- Sarah Jenkins -> Lead Frontend Developer
(2, 3, 'active'); -- Alexander Vance -> DevOps & Systems Architect

-- Insert Person Details
INSERT INTO person_details (
    person_id, mobile, company_name, barcode_data, monthly_salary, 
    total_experience, start_date, end_date, person_dept_id, person_role_id, 
    employee_code, company_address, person_address, status, remarks, payment_slip
) VALUES
(
    1, '+91 98765 43210', 'Apex Global Solutions', '8f7d9a12-4b21-41e9-9e8c-300000000001', 
    85000.00, '2 yrs 5 mos', '2022-03-01', NULL, 1, 1, 
    'EMP-1001', '100 Tech Highway, Cyber City, Gurugram, India', '742 Evergreen Terrace, Springfield, OR 97477', 
    'verified', 'Promoted to Senior Team Lead in 2024.', 'SalarySlip_Jan2026_SJenkins.pdf'
),
(
    2, '+91 91234 56789', 'CloudScale Dynamics', '8f7d9a12-4b21-41e9-9e8c-300000000002', 
    98000.00, '3 yrs 2 mos', '2021-06-01', NULL, 2, 2, 
    'EMP-1002', '500 Enterprise Way, HITEC City, Hyderabad, India', '100 Innovation Blvd, Tech City, CA 94016', 
    'verified', 'Maintains core cloud deployment infrastructure.', 'SalarySlip_CloudScale_Alex.pdf'
);
