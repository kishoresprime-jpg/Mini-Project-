const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { app, server } = require('./server');

// Seed imports
const User = require('./models/User');
const Department = require('./models/Department');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Workflow = require('./models/Workflow');
const WorkflowStage = require('./models/WorkflowStage');
const Approval = require('./models/Approval');
const Notification = require('./models/Notification');
const Comment = require('./models/Comment');
const AuditLog = require('./models/AuditLog');
const { calculateTaskDelayRisk } = require('./services/delayRiskService');

const runEmbeddedServer = async () => {
  try {
    console.log('\x1b[33m%s\x1b[0m', '=====================================================');
    console.log('\x1b[33m%s\x1b[0m', '>>> INITIALIZING EMBEDDED REAL MONGODB INSTANCE...');
    console.log('\x1b[33m%s\x1b[0m', '=====================================================');

    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'college_workflow',
      },
    }).catch(async () => {
      // If 27017 is occupied, allocate random port
      return await MongoMemoryServer.create({
        instance: { dbName: 'college_workflow' },
      });
    });

    const uri = mongod.getUri();
    process.env.MONGODB_URI = uri;
    console.log('\x1b[32m%s\x1b[0m', `>>> Embedded MongoDB Running at: ${uri}`);

    await mongoose.connect(uri);
    console.log('\x1b[32m%s\x1b[0m', '>>> Mongoose connected to embedded MongoDB database.');

    // Seed data
    console.log('>>> Seeding realistic college demonstration data...');
    const departments = await Department.insertMany([
      {
        name: 'Computer Science & Engineering',
        code: 'CSE',
        description: 'Department of Computer Science and Engineering, Software Systems, and Artificial Intelligence.',
      },
      {
        name: 'Electronics & Communication Engineering',
        code: 'ECE',
        description: 'Department of Electronics, Signal Processing, VLSI, and Embedded IoT Systems.',
      },
      {
        name: 'Mechanical Engineering',
        code: 'MECH',
        description: 'Department of Mechanical Engineering, Robotics, and Manufacturing Technology.',
      },
      {
        name: 'Civil Engineering',
        code: 'CIVIL',
        description: 'Department of Civil Infrastructure, Structural Engineering, and Environmental Systems.',
      },
      {
        name: 'Administrative & Academic Affairs',
        code: 'ADMIN',
        description: 'Central Administrative Office, Academic Dean, and Examination Control Division.',
      },
    ]);

    const cseDept = departments.find((d) => d.code === 'CSE');
    const eceDept = departments.find((d) => d.code === 'ECE');
    const adminDept = departments.find((d) => d.code === 'ADMIN');
    const defaultPassword = 'password123';

    // Users
    const superAdmin = await User.create({
      name: 'Dr. Arthur Vance',
      email: 'admin@college.edu',
      password: defaultPassword,
      role: 'super_admin',
      department: adminDept._id,
      designation: 'Director of Campus IT & Systems',
      phone: '+1 555-0100',
      skills: ['System Administration', 'Network Architecture', 'Data Security', 'Institutional Governance'],
    });

    const principal = await User.create({
      name: 'Dr. Elizabeth Warren',
      email: 'principal@college.edu',
      password: defaultPassword,
      role: 'principal',
      department: adminDept._id,
      designation: 'Principal & Head of Institution',
      phone: '+1 555-0101',
      skills: ['Academic Leadership', 'Accreditation', 'Strategic Planning', 'Resource Management'],
    });

    const hodCSE = await User.create({
      name: 'Prof. Marcus Brody',
      email: 'hod.cse@college.edu',
      password: defaultPassword,
      role: 'hod',
      department: cseDept._id,
      designation: 'Professor & Head of Department (CSE)',
      phone: '+1 555-0102',
      skills: ['Curriculum Design', 'Software Engineering', 'Project Oversight', 'Faculty Mentorship'],
      completedTasksCount: 18,
    });
    cseDept.hod = hodCSE._id;
    await cseDept.save();

    const hodECE = await User.create({
      name: 'Prof. Walter White',
      email: 'hod.ece@college.edu',
      password: defaultPassword,
      role: 'hod',
      department: eceDept._id,
      designation: 'Professor & Head of Department (ECE)',
      phone: '+1 555-0103',
      skills: ['VLSI Design', 'Embedded Systems', 'Lab Management', 'Research Grants'],
      completedTasksCount: 12,
    });
    eceDept.hod = hodECE._id;
    await eceDept.save();

    const facultyAlex = await User.create({
      name: 'Dr. Alex Mercer',
      email: 'alex.faculty@college.edu',
      password: defaultPassword,
      role: 'faculty',
      department: cseDept._id,
      designation: 'Associate Professor',
      phone: '+1 555-0104',
      skills: ['Machine Learning', 'Python', 'Cloud Computing', 'Data Analytics', 'Algorithms'],
      completedTasksCount: 14,
    });

    const facultyPriya = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'priya.faculty@college.edu',
      password: defaultPassword,
      role: 'faculty',
      department: cseDept._id,
      designation: 'Assistant Professor',
      phone: '+1 555-0105',
      skills: ['Database Systems', 'Node.js', 'MERN Stack', 'Cybersecurity', 'Web Architecture'],
      completedTasksCount: 9,
    });

    const staffDavid = await User.create({
      name: 'David Miller',
      email: 'david.staff@college.edu',
      password: defaultPassword,
      role: 'staff',
      department: cseDept._id,
      designation: 'Senior Lab Technologist',
      phone: '+1 555-0107',
      skills: ['Lab Equipment Maintenance', 'Server Configuration', 'Hardware Troubleshooting', 'Procurement'],
      completedTasksCount: 8,
    });

    const studentRahul = await User.create({
      name: 'Rahul Verma',
      email: 'rahul.student@college.edu',
      password: defaultPassword,
      role: 'student',
      department: cseDept._id,
      designation: 'Final Year B.Tech CSE',
      phone: '+1 555-0110',
      skills: ['Python', 'TensorFlow', 'REST APIs', 'MongoDB', 'Docker'],
      completedTasksCount: 5,
    });

    const studentKavya = await User.create({
      name: 'Kavya Raman',
      email: 'kavya.student@college.edu',
      password: defaultPassword,
      role: 'student',
      department: cseDept._id,
      designation: 'Final Year B.Tech CSE',
      phone: '+1 555-0109',
      skills: ['React', 'JavaScript', 'Tailwind CSS', 'UI/UX Design', 'Node.js'],
      completedTasksCount: 6,
    });

    // Workflow
    const workflow = await Workflow.create({
      name: 'Institutional Academic Audit & Accreditation Workflow',
      code: 'AUDIT-WF-01',
      description: 'Multi-tier workflow for institutional quality audits and NAAC criteria clearance.',
      department: null,
      isDefault: true,
      createdBy: principal._id,
    });

    const stages = await WorkflowStage.insertMany([
      {
        workflow: workflow._id,
        title: 'Project Initiation & Scope Definition',
        order: 1,
        requiredRole: 'principal',
        requiresApproval: true,
        stageType: 'creation',
      },
      {
        workflow: workflow._id,
        title: 'Department Work Distribution & Assignment',
        order: 2,
        requiredRole: 'hod',
        requiresApproval: true,
        stageType: 'assignment',
      },
      {
        workflow: workflow._id,
        title: 'Evidence Gathering & Task Execution',
        order: 3,
        requiredRole: 'faculty',
        requiresApproval: false,
        stageType: 'execution',
      },
      {
        workflow: workflow._id,
        title: 'HOD Departmental Verification',
        order: 4,
        requiredRole: 'hod',
        requiresApproval: true,
        mandatoryTasksCompleted: true,
        stageType: 'verification',
      },
      {
        workflow: workflow._id,
        title: 'Principal Institutional Clearance',
        order: 5,
        requiredRole: 'principal',
        requiresApproval: true,
        stageType: 'final_approval',
      },
      {
        workflow: workflow._id,
        title: 'Concluded & Archived',
        order: 6,
        requiredRole: 'super_admin',
        requiresApproval: false,
        stageType: 'completion',
      },
    ]);

    // Projects
    const project1 = await Project.create({
      title: 'NAAC Cycle-3 Institutional Accreditation Dossier',
      code: 'PRJ-2026-NAAC',
      description: 'Comprehensive college-wide accreditation verification covering criteria 1 through 7.',
      department: adminDept._id,
      createdBy: principal._id,
      projectManager: principal._id,
      members: [hodCSE._id, facultyAlex._id],
      workflow: workflow._id,
      currentStage: stages[1]._id,
      priority: 'critical',
      status: 'active',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      targetEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      progressPercentage: 45,
    });

    const project2 = await Project.create({
      title: 'AI Smart Campus Attendance & Resource Allocation Grid',
      code: 'PRJ-2026-CSE-AI',
      description: 'Departmental project for automated classroom attendance and energy conservation.',
      department: cseDept._id,
      createdBy: hodCSE._id,
      projectManager: facultyAlex._id,
      members: [facultyPriya._id, staffDavid._id, studentRahul._id, studentKavya._id],
      workflow: workflow._id,
      currentStage: stages[2]._id,
      priority: 'high',
      status: 'active',
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      targetEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      progressPercentage: 35,
    });

    // Tasks
    const now = new Date();
    const task1 = await Task.create({
      title: 'Faculty Publication & Citation Metrics Compilation (2023-2026)',
      description: 'Collect all Scopus and WoS indexed publications from CSE faculty.',
      project: project1._id,
      department: cseDept._id,
      assignedTo: facultyPriya._id,
      assignedBy: hodCSE._id,
      status: 'Completed',
      priority: 'High',
      progress: 100,
      deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      estimatedHours: 20,
      requiredSkills: ['Data Analytics', 'Documentation'],
      subtasks: [
        { title: 'Download Scopus database export', isCompleted: true },
        { title: 'Verify citations with faculty authors', isCompleted: true },
      ],
      delayRisk: { level: 'Low', score: 0, reasons: ['Completed and verified.'] },
    });

    const task2 = new Task({
      title: 'Laboratory Equipment Calibration & Safety Audit Log',
      description: 'Conduct safety checks across CSE computer labs and submit inspection certificates.',
      project: project1._id,
      department: cseDept._id,
      assignedTo: staffDavid._id,
      assignedBy: hodCSE._id,
      status: 'In Progress',
      priority: 'Critical',
      progress: 25,
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      deadline: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // overdue
      estimatedHours: 16,
      requiredSkills: ['Lab Equipment Maintenance', 'Hardware Troubleshooting'],
      subtasks: [
        { title: 'Inspect UPS backup batteries in Lab 1-3', isCompleted: true },
        { title: 'Obtain vendor calibration stamp', isCompleted: false },
      ],
    });
    task2.delayRisk = calculateTaskDelayRisk(task2, 0);
    await task2.save();

    const task3 = await Task.create({
      title: 'Convolutional Neural Network Model Training for Attendance Verification',
      description: 'Implement face embedding inference pipeline using lightweight MobileFaceNet.',
      project: project2._id,
      department: cseDept._id,
      assignedTo: studentRahul._id,
      assignedBy: facultyAlex._id,
      status: 'Submitted for Review',
      priority: 'High',
      progress: 95,
      deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      estimatedHours: 35,
      requiredSkills: ['Python', 'TensorFlow', 'Deep Learning'],
      subtasks: [
        { title: 'Dataset augmentation & preprocessing', isCompleted: true },
        { title: 'Hyperparameter tuning & validation tests', isCompleted: true },
      ],
      submission: {
        notes: 'Model weights exported to ONNX format with 99.1% precision on sample dataset.',
        submittedAt: new Date(),
        submittedBy: studentRahul._id,
      },
      delayRisk: { level: 'Low', score: 15, reasons: ['Submitted on schedule ahead of deadline.'] },
    });

    const task4 = new Task({
      title: 'Responsive Student Portal Dashboard UI Components',
      description: 'Build modern Tailwind CSS dashboard cards and attendance charts.',
      project: project2._id,
      department: cseDept._id,
      assignedTo: studentKavya._id,
      assignedBy: facultyAlex._id,
      status: 'In Progress',
      priority: 'Medium',
      progress: 60,
      deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
      estimatedHours: 24,
      requiredSkills: ['React', 'JavaScript', 'Tailwind CSS'],
      subtasks: [
        { title: 'Draft wireframes and color scheme', isCompleted: true },
        { title: 'Connect API endpoints to Recharts widgets', isCompleted: false },
      ],
    });
    task4.delayRisk = calculateTaskDelayRisk(task4, 0);
    await task4.save();

    // Approval
    const approval = await Approval.create({
      type: 'task_submission',
      task: task3._id,
      project: project2._id,
      department: cseDept._id,
      submittedBy: studentRahul._id,
      requiredRole: 'hod',
      status: 'Pending',
      submissionNotes: 'CNN model completed. Please review and verify for integration.',
    });

    // Notification
    await Notification.create({
      recipient: hodCSE._id,
      sender: studentRahul._id,
      title: 'New Submission for Verification',
      message: 'Rahul Verma has submitted "Convolutional Neural Network Model Training" for your approval.',
      type: 'approval_requested',
      priority: 'high',
      link: '/approvals',
      referenceId: approval._id,
      referenceModel: 'Approval',
    });

    // Audit Log
    await AuditLog.create({
      action: 'SYSTEM_BOOTSTRAP',
      performedBy: superAdmin._id,
      userRole: 'super_admin',
      department: adminDept._id,
      targetModel: 'System',
      description: 'System initialized with embedded MongoDB, default workflows, and hierarchical roles.',
    });

    console.log('\x1b[32m%s\x1b[0m', '>>> Demonstration data successfully loaded into MongoDB!');

    // Start Express HTTP + Socket.IO Server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log('\x1b[36m%s\x1b[0m', '=====================================================');
      console.log('\x1b[36m%s\x1b[0m', `>>> BACKEND SERVER READY ON PORT ${PORT} [EMBEDDED MONGODB]`);
      console.log('\x1b[32m%s\x1b[0m', '>>> DEMO ACCOUNTS READY (Password: password123)');
      console.log('\x1b[37m%s\x1b[0m', '  - Super Admin: admin@college.edu');
      console.log('\x1b[37m%s\x1b[0m', '  - Principal:   principal@college.edu');
      console.log('\x1b[37m%s\x1b[0m', '  - HOD (CSE):   hod.cse@college.edu');
      console.log('\x1b[37m%s\x1b[0m', '  - Faculty:     alex.faculty@college.edu');
      console.log('\x1b[37m%s\x1b[0m', '  - Staff:       david.staff@college.edu');
      console.log('\x1b[37m%s\x1b[0m', '  - Student:     rahul.student@college.edu');
      console.log('\x1b[36m%s\x1b[0m', '=====================================================');
    });
  } catch (error) {
    console.error('Embedded server startup error:', error);
    process.exit(1);
  }
};

runEmbeddedServer();

