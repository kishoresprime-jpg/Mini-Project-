# AI-Powered College Workflow & Intelligent Task Management System with Hierarchical Access Control

A centralized platform developed on the **MERN stack** to manage institutional projects, department workflows, academic staff tasks, deadlines, approvals, workload distribution, and performance analytics.

---

## Abstract

The **AI-Powered College Workflow and Intelligent Task Management System with Hierarchical Access Control** is an enterprise-grade web application designed to streamline academic and administrative activities within educational institutions. The system provides a centralized platform for managing projects, assigning tasks, monitoring progress, handling approvals, and tracking deadlines. It supports multiple user roles, including **Super Admin, Principal, HOD, Faculty, Staff, and Student**, with hierarchical access control to ensure secure access to information based on user responsibilities and permissions.

The proposed system incorporates automated workflow management, enabling tasks to progress through predefined stages based on completion and approval. An intelligent task recommendation mechanism suggests suitable assignees by considering relevant skills, current workload, and previous task performance. Workload balancing helps distribute responsibilities effectively, while delay-risk estimation identifies tasks that may require attention before their deadlines. Interactive dashboards provide insights into task completion, department performance, workload distribution, and project progress.

**Keywords:** MERN Stack, College Workflow Management, Task Tracking, Hierarchical Access Control, Intelligent Task Assignment, Workload Balancing, Workflow Automation.

---

## Technology Stack

- **Frontend:**
  - React.js with Vite
  - Tailwind CSS (Deep Navy enterprise palette & Dark mode support)
  - React Router v6
  - Axios with Bearer token interceptors
  - Recharts for real-time analytics
  - Lucide React iconography
- **Backend:**
  - Node.js & Express.js
  - REST API architecture
  - JWT authentication & bcrypt password hashing
  - Socket.IO for real-time in-app notifications
  - Helmet & express-rate-limit
  - Centralized error handling & Audit logging
- **Database:**
  - MongoDB with Mongoose ODM
  - Relationships, indexing, and strict schema validation
- **AI & Intelligent Modules:**
  - Transparent Multi-Factor Task Assignment Recommendation Engine
  - Explainable Delay-Risk Estimation Radar with corrective recommendations
  - Workload Balancing & Overload Detection

---

## User Roles & Hierarchy

1. **Super Admin (Level 6):** Manage institutional departments, user accounts, system configuration, audit logs, and global analytics.
2. **Principal (Level 5):** Cross-department project governance, institutional performance dashboards, milestone reviews, and final clearances.
3. **HOD (Level 4):** Department-scoped project management, task assignment, deliverable verification & approvals, faculty workload monitoring.
4. **Faculty (Level 3):** Assigned deliverables execution, progress updates, task creation within permitted scope, review submission.
5. **Staff (Level 2):** Administrative and laboratory tasks, checklist execution, evidence uploads, verification submissions.
6. **Student (Level 1):** Course and project assignments, subtask progress tracking, submission with deliverables.

---

## Quick Start Guide

### 1. Prerequisites
- Node.js (v18+ or v20+ recommended)
- MongoDB instance (Local MongoDB Community or free MongoDB Atlas cluster)

### 2. Environment Setup
The backend environment file is configured in `backend/.env`.
```bash
# Verify or edit backend/.env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/college_workflow
# (OR for MongoDB Atlas:)
# MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/college_workflow?retryWrites=true&w=majority
JWT_SECRET=college_workflow_dev_jwt_secret_key_2026_xyz123!
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Install Dependencies
```bash
# Install root, backend, and frontend packages:
npm run install:all
```

### 4. Seed Database with Realistic College Data
```bash
npm run seed
```

### 5. Run the Application
In separate terminal windows (or concurrently via root):
```bash
# Run both servers together:
npm run dev

# OR individually:
# Terminal 1 (Backend API on http://localhost:5000):
npm run server

# Terminal 2 (Vite Frontend on http://localhost:5173):
npm run client
```

Open `http://localhost:5173` in your browser.

---

## Demo Accounts (1-Click Login Available)

All demo accounts use the standard password: `password123`

| Role | Email | Department | Key Capabilities |
|---|---|---|---|
| **Super Admin** | `admin@college.edu` | Central Admin | Full governance, User & Dept management, Audit logs |
| **Principal** | `principal@college.edu` | Academic Affairs | Cross-department oversight, Institutional approvals |
| **HOD (CSE)** | `hod.cse@college.edu` | CSE | Department tasks, Approval Center, Faculty workload |
| **Faculty** | `alex.faculty@college.edu` | CSE | Task execution, AI Assignment Matcher, Submissions |
| **Staff** | `david.staff@college.edu` | CSE | Lab maintenance, checklist updates, Evidence logs |
| **Student** | `rahul.student@college.edu` | CSE | Student deliverables, Task progress, Work submissions |

*(The login page includes 1-click quick-fill buttons for each role for instant demonstration.)*

---

## Key Features & Module Overview

1. **Hierarchical Access Control & Department Isolation:**
   - Enforced on the backend REST API and frontend navigation.
   - Prevents unauthorized access across department boundaries or privilege escalation.
2. **Automated Workflows & Approval Center:**
   - Multi-tier stage progression (Creation &rarr; Approval &rarr; Assignment &rarr; Execution &rarr; Submission &rarr; HOD Verification &rarr; Completion).
   - Incomplete mandatory tasks block stage advancement.
3. **AI Task Assignment Recommendations:**
   - Multi-criteria heuristic scoring based on skill overlap, active task saturation, priority, and completion track record.
   - Transparent scoring breakdowns with explainable bullet points.
4. **Workload Balancing & Overload Detection:**
   - Real-time priority-weighted scoring (Critical=5, High=3, Medium=2, Low=1).
   - Flags overloaded personnel (> 14 weighted points) and identifies available members.
5. **Delay-Risk Radar:**
   - Evaluates progress lag against elapsed timeline and blocked prerequisites.
   - Provides actionable corrective recommendations and expected completion estimates.
6. **Compliance Audit Trail & CSV Reports:**
   - Full immutable audit log of administrative actions.
   - One-click CSV exports for task and project reports.

---

## Automated Unit Testing

Run the backend unit test suite:
```bash
npm test
```
Verifies RBAC rank hierarchy, department isolation enforcement, workload priority weighting, and delay-risk estimation logic.

