# Background Verification System - PostgreSQL Database Setup

This database schema is designed according to the relational entity-relationship (ER) specifications for the **Background Verification System**, including `person`, `department`, `roles`, `person_department`, `person_roles`, and `person_details`.

---

## 📐 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    PERSON ||--o{ PERSON_DEPARTMENT : "assigned to"
    DEPARTMENT ||--o{ PERSON_DEPARTMENT : "belongs to"
    PERSON ||--o{ PERSON_ROLES : "holds"
    ROLES ||--o{ PERSON_ROLES : "assigned in"
    PERSON ||--o{ PERSON_DETAILS : "has details"
    PERSON_DEPARTMENT ||--o{ PERSON_DETAILS : "referenced in"
    PERSON_ROLES ||--o{ PERSON_DETAILS : "referenced in"

    PERSON {
        bigint id PK
        varchar name
        varchar email UK
        varchar status
        timestamptz created_at
    }

    DEPARTMENT {
        bigint id PK
        varchar name UK
        varchar status
        timestamptz created_at
    }

    ROLES {
        bigint id PK
        varchar name UK
        varchar status
        timestamptz created_at
    }

    PERSON_DEPARTMENT {
        bigint id PK
        bigint person_id FK
        bigint department_id FK
        varchar status
        timestamptz created_at
    }

    PERSON_ROLES {
        bigint id PK
        bigint person_id FK
        bigint role_id FK
        varchar status
        timestamptz created_at
    }

    PERSON_DETAILS {
        bigint id PK
        bigint person_id FK
        varchar mobile
        varchar company_name
        text barcode_data
        numeric monthly_salary
        varchar total_experience
        date start_date
        date end_date
        bigint person_dept_id FK
        bigint person_role_id FK
        varchar employee_code
        text company_address
        text person_address
        timestamptz created_at
        varchar status
        text remarks
        text payment_slip
    }
```

---

## 📋 Schema Table Columns

### `person_details` (Verification Details Entity)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Auto-increment unique ID |
| `person_id` | `BIGINT` | `FK -> person(id)` | Foreign Key referencing individual |
| `mobile` | `VARCHAR(20)` | `NULLABLE` | Contact phone / mobile number |
| `company_name` | `VARCHAR(150)` | `NULLABLE` | Employer organization name |
| `barcode_data` | `TEXT` | `NULLABLE` | Verification QR/Barcode hash string |
| `monthly_salary` | `NUMERIC(12,2)` | `NULLABLE` | Monthly salary compensation |
| `total_experience` | `VARCHAR(50)` | `NULLABLE` | Tenure duration string (e.g. "2 yrs 5 mos") |
| `start_date` | `DATE` | `NULLABLE` | Employment start date |
| `end_date` | `DATE` | `NULLABLE` | Employment end date (NULL if active) |
| `person_dept_id` | `BIGINT` | `FK -> person_department(id)` | Department junction reference |
| `person_role_id` | `BIGINT` | `FK -> person_roles(id)` | Role junction reference |
| `employee_code` | `VARCHAR(50)` | `NULLABLE` | Organization Employee Code / ID |
| `company_address` | `TEXT` | `NULLABLE` | Company physical location |
| `person_address` | `TEXT` | `NULLABLE` | Residential / permanent address |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |
| `status` | `VARCHAR(50)` | `DEFAULT 'active'` | Verification / record status |
| `remarks` | `TEXT` | `NULLABLE` | Notes, achievements, or details |
| `payment_slip` | `TEXT` | `NULLABLE` | Salary slip document URL / filename |

---

## 🚀 Commands to Manage Database with Prisma

```bash
# Push database schema to PostgreSQL
npm run db:push

# Generate Prisma Client
npm run db:generate

# Seed sample data into PostgreSQL
node prisma/seed.js

# Launch Prisma Studio (Visual DB Inspector)
npm run db:studio
```
