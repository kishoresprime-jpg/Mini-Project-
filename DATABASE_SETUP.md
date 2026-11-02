# MongoDB Database Setup Guide

This application stores all persistent records (Users, Departments, Projects, Tasks, Workflows, Stages, Approvals, Notifications, Comments, Attachments, Audit Logs) in MongoDB via Mongoose ODM.

---

## Option 1: MongoDB Atlas (Recommended Free Cloud Database)

1. Navigate to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free M0 cluster.
2. In the **Security > Quickstart**:
   - Create a database user with username and password (e.g., `college_admin` / `YourSecurePassword123`).
   - Under **Network Access**, add IP address `0.0.0.0/0` (allow access from anywhere) or your current machine IP.
3. In **Database Deployments**, click **Connect** > **Drivers** (Node.js).
4. Copy the connection string format:
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/college_workflow?retryWrites=true&w=majority
   ```
5. Open `backend/.env` and set:
   ```env
   MONGODB_URI=mongodb+srv://college_admin:YourSecurePassword123@cluster0.mongodb.net/college_workflow?retryWrites=true&w=majority
   ```

---

## Option 2: Local MongoDB Instance

1. Download and install [MongoDB Community Server](https://www.mongodb.com/try/download/community).
2. Start the MongoDB service or run:
   ```bash
   mongod --dbpath <path_to_your_db_folder>
   ```
3. Default local connection string in `backend/.env`:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/college_workflow
   ```

---

## Seeding Demo Data

Once your MongoDB connection string is configured in `backend/.env`, populate the database with realistic academic departments, projects, tasks, workflows, and accounts across all 6 roles:

```bash
# From root directory:
npm run seed

# OR directly inside the backend directory:
cd backend
npm run seed
```

This generates:
- 5 Academic Departments: CSE, ECE, MECH, CIVIL, ADMIN
- 12 Realistic Users across Super Admin, Principal, HOD, Faculty, Staff, and Student roles
- Multi-tier Institutional Accreditation & Departmental Capstone Workflows
- Active Projects, Subtasks, Delay-Risk Assessments, Approvals, and Audit Logs

---

## Database Connection Error Behavior

In compliance with the project specifications, **the application will not silently fall back to ephemeral storage**. If `MONGODB_URI` cannot be reached or is invalid, the backend outputs an explicit startup guide with diagnostic instructions and terminates cleanly.

