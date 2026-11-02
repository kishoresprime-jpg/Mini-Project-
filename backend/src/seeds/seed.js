const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Department = require('../models/Department');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Workflow = require('../models/Workflow');
const WorkflowStage = require('../models/WorkflowStage');
const Approval = require('../models/Approval');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const AuditLog = require('../models/AuditLog');
const { calculateTaskDelayRisk } = require('../services/delayRiskService');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_workflow';
    console.log(`Connecting to MongoDB for seeding at: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing database collections...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Workflow.deleteMany({}),
      WorkflowStage.deleteMany({}),
      Approval.deleteMany({}),
      Notification.deleteMany({}),
      Comment.deleteMany({}),
      Attachment.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    console.log('Seeding College Departments...');
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

    console.log('Seeding Users across all 6 roles...');
    // Default password for all demo accounts: 'password123'
    const defaultPassword = 'password123';

    // 1. Super Admin
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

    // 2. Principal
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

    // 3. HODs
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

    // 4. Faculty Members
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

    const facultyChen = await User.create({
      name: 'Dr. Robert Chen',
      email: 'chen.faculty@college.edu',
      password: defaultPassword,
      role: 'faculty',
      department: eceDept._id,
      designation: 'Associate Professor',
      phone: '+1 555-0106',
      skills: ['IoT Grid Systems', 'Robotics', 'C++', 'Digital Signal Processing'],
      completedTasksCount: 11,
    });

    // 5. Staff Members
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

    const staffSarah = await User.create({
      name: 'Sarah Jenkins',
      email: 'sarah.staff@college.edu',
      password: defaultPassword,
      role: 'staff',
      department: adminDept._id,
      designation: 'Academic Records Coordinator',
      phone: '+1 555-0108',
      skills: ['Documentation', 'Audit Preparation', 'Student Records', 'Exam Scheduling'],
      completedTasksCount: 15,
    });

    // 6. Students
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

    console.log('Seeding Workflows and Stages...');
    // Workflow 1: Institutional Accreditation & Audit Workflow
    const institutionalWorkflow = await Workflow.create({
      name: 'Institutional Academic Audit & Accreditation Workflow',
      code: 'AUDIT-WF-01',
      description: 'Standard multi-tier workflow for institutional quality audits and NAAC/NBA criteria clearance.',
      department: null, // institutional
      isDefault: true,
      createdBy: principal._id,
    });

    const stagesAudit = await WorkflowStage.insertMany([
      {
        workflow: institutionalWorkflow._id,
        title: 'Project Initiation & Scope Definition',
        order: 1,
        description: 'Principal and Deans formulate project targets and documentation guidelines.',
        requiredRole: 'principal',
        requiresApproval: true,
        stageType: 'creation',
      },
      {
        workflow: institutionalWorkflow._id,
        title: 'Department Work Distribution & Assignment',
        order: 2,
        description: 'HODs assign criteria and documentation sections to department faculty and coordinators.',
        requiredRole: 'hod',
        requiresApproval: true,
        stageType: 'assignment',
      },
      {
        workflow: institutionalWorkflow._id,
        title: 'Evidence Gathering & Task Execution',
        order: 3,
        description: 'Faculty and staff assemble supporting materials, syllabi, lab logs, and metrics.',
        requiredRole: 'faculty',
        requiresApproval: false,
        stageType: 'execution',
      },
      {
        workflow: institutionalWorkflow._id,
        title: 'HOD Departmental Verification',
        order: 4,
        description: 'HOD reviews deliverables, validates evidentiary proof, and signs off.',
        requiredRole: 'hod',
        requiresApproval: true,
        mandatoryTasksCompleted: true,
        stageType: 'verification',
      },
      {
        workflow: institutionalWorkflow._id,
        title: 'Principal Institutional Clearance',
        order: 5,
        description: 'Final institutional audit approval by the Principal before external dossier submission.',
        requiredRole: 'principal',
        requiresApproval: true,
        stageType: 'final_approval',
      },
      {
        workflow: institutionalWorkflow._id,
        title: 'Concluded & Archived',
        order: 6,
        description: 'Audit dossier confirmed and submitted to regulatory body repository.',
        requiredRole: 'super_admin',
        requiresApproval: false,
        stageType: 'completion',
      },
    ]);

    console.log('Seeding Projects...');
    const project1 = await Project.create({
      title: 'NAAC Cycle-3 Institutional Accreditation Dossier',
      code: 'PRJ-2026-NAAC',
      description: 'Comprehensive college-wide accreditation verification covering criteria 1 through 7, faculty publications, infrastructure metrics, and outcome-based education benchmarks.',
      department: adminDept._id,
      createdBy: principal._id,
      projectManager: principal._id,
      members: [hodCSE._id, hodECE._id, facultyAlex._id, staffSarah._id],
      workflow: institutionalWorkflow._id,
      currentStage: stagesAudit[1]._id, // Stage 2: Department Work Distribution
      priority: 'critical',
      status: 'active',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      targetEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      progressPercentage: 45,
    });

    const project2 = await Project.create({
      title: 'AI Smart Campus Attendance & Resource Allocation Grid',
      code: 'PRJ-2026-CSE-AI',
      description: 'Departmental project to architect a high-throughput facial recognition and wireless sensor network for automated classroom attendance and energy conservation.',
      department: cseDept._id,
      createdBy: hodCSE._id,
      projectManager: facultyAlex._id,
      members: [facultyPriya._id, staffDavid._id, studentKavya._id, studentRahul._id],
      workflow: institutionalWorkflow._id,
      currentStage: stagesAudit[2]._id, // Stage 3: Execution
      priority: 'high',
      status: 'active',
      startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      targetEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      progressPercentage: 35,
    });

    console.log('Seeding Tasks with Delay-Risk Metrics...');
    // Helper dates
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const inTwoDays = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const inFifteenDays = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const pastOverdue = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Task 1: Completed task
    const task1 = await Task.create({
      title: 'Faculty Publication & Citation Metrics Compilation (2023-2026)',
      description: 'Collect all Scopus and WoS indexed publications from CSE faculty, verified with DOI links and h-index citations.',
      project: project1._id,
      department: cseDept._id,
      assignedTo: facultyPriya._id,
      assignedBy: hodCSE._id,
      status: 'Completed',
      priority: 'High',
      progress: 100,
      startDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      deadline: threeDaysAgo,
      completedAt: threeDaysAgo,
      estimatedHours: 20,
      actualHours: 18,
      requiredSkills: ['Data Analytics', 'Documentation', 'Academic Governance'],
      subtasks: [
        { title: 'Download Scopus database export', isCompleted: true },
        { title: 'Verify citations with faculty authors', isCompleted: true },
        { title: 'Format PDF annexure table', isCompleted: true },
      ],
      delayRisk: {
        level: 'Low',
        score: 0,
        reasons: ['Task is completed and verified.'],
        recommendedAction: 'Completed.',
        isRuleBased: true,
      },
    });

    // Task 2: High Risk / Overdue Task
    const task2 = new Task({
      title: 'Laboratory Equipment Calibration & Safety Audit Log',
      description: 'Conduct full mechanical and electrical safety checks across all 6 CSE computer labs and submit signed inspection certificates.',
      project: project1._id,
      department: cseDept._id,
      assignedTo: staffDavid._id,
      assignedBy: hodCSE._id,
      status: 'In Progress',
      priority: 'Critical',
      progress: 25,
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      deadline: pastOverdue, // overdue!
      estimatedHours: 16,
      actualHours: 6,
      requiredSkills: ['Lab Equipment Maintenance', 'Hardware Troubleshooting', 'Safety Compliance'],
      subtasks: [
        { title: 'Inspect UPS backup batteries in Lab 1-3', isCompleted: true },
        { title: 'Inspect network rack fire suppression system', isCompleted: false },
        { title: 'Obtain vendor calibration stamp', isCompleted: false },
      ],
    });
    task2.delayRisk = calculateTaskDelayRisk(task2, 0);
    await task2.save();

    // Task 3: Submitted for Review (Ready for Approval demonstration)
    const task3 = await Task.create({
      title: 'Convolutional Neural Network Model Training for Attendance Verification',
      description: 'Implement face embedding inference pipeline using lightweight MobileFaceNet with 99.2% LFW validation accuracy.',
      project: project2._id,
      department: cseDept._id,
      assignedTo: studentRahul._id,
      assignedBy: facultyAlex._id,
      status: 'Submitted for Review',
      priority: 'High',
      progress: 95,
      startDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      deadline: inTwoDays,
      estimatedHours: 35,
      actualHours: 32,
      requiredSkills: ['Python', 'TensorFlow', 'Deep Learning', 'Computer Vision'],
      subtasks: [
        { title: 'Dataset augmentation & preprocessing', isCompleted: true },
        { title: 'Hyperparameter tuning & validation tests', isCompleted: true },
        { title: 'Export ONNX runtime format', isCompleted: true },
      ],
      submission: {
        notes: 'Model weights exported to ONNX format. Precision tested at 99.1% on classroom sample dataset. Ready for review.',
        submittedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        submittedBy: studentRahul._id,
      },
      delayRisk: {
        level: 'Low',
        score: 15,
        reasons: ['Work submitted on schedule ahead of deadline.'],
        recommendedAction: 'Awaiting HOD/Faculty sign-off in Approval Center.',
        isRuleBased: true,
      },
    });

    // Task 4: In Progress Task (Student)
    const task4 = new Task({
      title: 'Responsive Student Portal Dashboard UI Components',
      description: 'Build modern Tailwind CSS dashboard cards, attendance charts, and real-time status indicators in React.',
      project: project2._id,
      department: cseDept._id,
      assignedTo: studentKavya._id,
      assignedBy: facultyAlex._id,
      status: 'In Progress',
      priority: 'Medium',
      progress: 60,
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      deadline: inFiveDays,
      estimatedHours: 24,
      actualHours: 14,
      requiredSkills: ['React', 'JavaScript', 'Tailwind CSS', 'UI/UX Design'],
      subtasks: [
        { title: 'Draft wireframes and color scheme', isCompleted: true },
        { title: 'Implement sidebar and navigation bar', isCompleted: true },
        { title: 'Connect API endpoints to Recharts widgets', isCompleted: false },
      ],
    });
    task4.delayRisk = calculateTaskDelayRisk(task4, 0);
    await task4.save();

    // Task 5: Blocked Task (Dependencies)
    const task5 = new Task({
      title: 'Cloud Edge Gateway Deployment & Production Sync',
      description: 'Deploy dockerized API container to on-premise Kubernetes cluster and configure TLS certificates.',
      project: project2._id,
      department: cseDept._id,
      assignedTo: facultyPriya._id,
      assignedBy: hodCSE._id,
      status: 'Blocked',
      priority: 'High',
      progress: 10,
      startDate: new Date(),
      deadline: inFifteenDays,
      estimatedHours: 16,
      requiredSkills: ['Cloud Computing', 'Docker', 'Kubernetes', 'Cybersecurity'],
      dependencies: [task3._id], // Blocked on task3 approval
      subtasks: [
        { title: 'Write Dockerfile and healthcheck scripts', isCompleted: true },
        { title: 'Provision server hardware ingress', isCompleted: false },
      ],
    });
    task5.delayRisk = calculateTaskDelayRisk(task5, 1);
    await task5.save();

    console.log('Seeding Approvals...');
    const approval1 = await Approval.create({
      type: 'task_submission',
      task: task3._id,
      project: project2._id,
      department: cseDept._id,
      submittedBy: studentRahul._id,
      requiredRole: 'hod',
      status: 'Pending',
      submissionNotes: 'CNN model completed with high accuracy benchmark. Please review and verify for integration.',
    });

    console.log('Seeding In-App Notifications...');
    await Notification.insertMany([
      {
        recipient: hodCSE._id,
        sender: studentRahul._id,
        title: 'New Submission for Verification',
        message: 'Rahul Verma has submitted "Convolutional Neural Network Model Training" for your approval.',
        type: 'approval_requested',
        priority: 'high',
        link: '/approvals',
        referenceId: approval1._id,
        referenceModel: 'Approval',
      },
      {
        recipient: staffDavid._id,
        title: 'Delay-Risk Alert: Task Overdue',
        message: 'Task "Laboratory Equipment Calibration" is past its scheduled deadline. Please update status.',
        type: 'delay_risk_alert',
        priority: 'urgent',
        link: `/tasks/${task2._id}`,
        referenceId: task2._id,
        referenceModel: 'Task',
      },
      {
        recipient: studentKavya._id,
        title: 'Milestone Review Approaching',
        message: 'Your task "Responsive Student Portal Dashboard" is scheduled for review in 5 days.',
        type: 'deadline_approaching',
        priority: 'medium',
        link: `/tasks/${task4._id}`,
        referenceId: task4._id,
        referenceModel: 'Task',
      },
    ]);

    console.log('Seeding Comments...');
    await Comment.create({
      task: task3._id,
      author: facultyAlex._id,
      content: 'I examined the confusion matrix and loss graphs. Performance looks solid on the test split. Recommended for HOD sign-off.',
    });

    console.log('Seeding Initial Audit Logs...');
    await AuditLog.insertMany([
      {
        action: 'SYSTEM_BOOTSTRAP',
        performedBy: superAdmin._id,
        userRole: 'super_admin',
        department: adminDept._id,
        targetModel: 'System',
        description: 'System seeded with academic departments, default workflows, and hierarchical user roles.',
      },
      {
        action: 'PROJECT_CREATED',
        performedBy: principal._id,
        userRole: 'principal',
        department: adminDept._id,
        targetModel: 'Project',
        targetId: project1._id,
        description: `Created institutional project "${project1.title}" with target accreditation deadline.`,
      },
    ]);

    console.log('\n\x1b[32m%s\x1b[0m', '==========================================================');
    console.log('\x1b[32m%s\x1b[0m', 'SUCCESS: DATABASE SEEDED WITH REALISTIC COLLEGE DATA!');
    console.log('\x1b[36m%s\x1b[0m', '==========================================================');
    console.log('DEMO ACCOUNTS (All passwords: password123):');
    console.log('1. Super Admin: admin@college.edu');
    console.log('2. Principal:   principal@college.edu');
    console.log('3. HOD (CSE):   hod.cse@college.edu');
    console.log('4. Faculty:     alex.faculty@college.edu');
    console.log('5. Staff:       david.staff@college.edu');
    console.log('6. Student:     rahul.student@college.edu');
    console.log('\x1b[32m%s\x1b[0m', '==========================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();

