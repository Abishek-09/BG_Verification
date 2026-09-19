-- =====================================================================
-- Background Verification System - PostgreSQL Database Schema
-- Entities: Person, Department, Roles, Person_Department, Person_Roles, Person_Details, Attendance
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop Tables (in reverse dependency order)
DROP TABLE IF EXISTS attendance CASCADE;
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
-- Stores employee details, barcode string, salary, and company info
-- ---------------------------------------------------------------------
CREATE TABLE person_details (
    id                BIGSERIAL PRIMARY KEY,
    person_id         BIGINT       NOT NULL REFERENCES person(id) ON DELETE CASCADE ON UPDATE CASCADE,
    mobile            VARCHAR(20),
    company_name      VARCHAR(150),
    barcode_data      TEXT,
    monthly_salary    NUMERIC(12, 2),
    total_experience  VARCHAR(50),
    start_date        DATE         DEFAULT CURRENT_DATE,
    end_date          DATE,
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    person_dept_id    BIGINT       REFERENCES person_department(id) ON DELETE SET NULL ON UPDATE CASCADE,
    person_role_id    BIGINT       REFERENCES person_roles(id) ON DELETE SET NULL ON UPDATE CASCADE,
    employee_code     VARCHAR(50)  UNIQUE,
    biometric_pin     VARCHAR(50),
    company_address   TEXT,
    person_address    TEXT,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status            VARCHAR(50)  NOT NULL DEFAULT 'active',
    remarks           TEXT,
    payment_slip      TEXT,
    photo_url         TEXT
);

-- ---------------------------------------------------------------------
-- 7. ATTENDANCE TABLE
-- Camera Barcode Scanner Attendance (Daily Check-In & Check-Out)
-- ---------------------------------------------------------------------
CREATE TABLE attendance (
    id                  BIGSERIAL PRIMARY KEY,
    person_id           BIGINT       REFERENCES person(id) ON DELETE CASCADE ON UPDATE CASCADE,
    employee_code       VARCHAR(50)  NOT NULL,
    employee_name       VARCHAR(150) NOT NULL,
    department          VARCHAR(150),
    punch_time          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    punch_date          DATE         NOT NULL DEFAULT CURRENT_DATE,
    check_in_time       TIMESTAMPTZ,
    check_out_time      TIMESTAMPTZ,
    duration            VARCHAR(50),
    verification_type   VARCHAR(100) DEFAULT 'Barcode Scanner',
    location            VARCHAR(150) DEFAULT 'Front Desk',
    device_name         VARCHAR(150) DEFAULT 'Camera Barcode Scanner',
    terminal_sn         VARCHAR(100),
    status              VARCHAR(50)  NOT NULL DEFAULT 'Present',
    work_mode           VARCHAR(100) NOT NULL DEFAULT 'On-Site Scanner',
    notes               TEXT,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- One daily attendance record per employee
    CONSTRAINT uq_attendance_person_date UNIQUE (person_id, punch_date)
);

-- =====================================================================
-- INDEXES
-- =====================================================================
CREATE INDEX idx_person_email ON person(email);
CREATE INDEX idx_person_details_person_id ON person_details(person_id);
CREATE INDEX idx_person_details_emp_code ON person_details(employee_code);
CREATE INDEX idx_person_details_barcode ON person_details(barcode_data);
CREATE INDEX idx_attendance_person_id ON attendance(person_id);
CREATE INDEX idx_attendance_emp_code ON attendance(employee_code);
CREATE INDEX idx_attendance_punch_date ON attendance(punch_date);
