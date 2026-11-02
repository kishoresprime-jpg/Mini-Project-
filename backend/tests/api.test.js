const test = require('node:test');
const assert = require('node:assert/strict');

// Import services and helpers to test
const { calculateTaskDelayRisk } = require('../src/services/delayRiskService');
const { PRIORITY_WEIGHTS } = require('../src/services/workloadService');
const { ROLE_HIERARCHY, canAccessDepartment } = require('../src/middleware/rbac');

test('Hierarchical RBAC: Role hierarchy rank ordering', () => {
  assert.equal(ROLE_HIERARCHY['super_admin'], 6);
  assert.equal(ROLE_HIERARCHY['principal'], 5);
  assert.equal(ROLE_HIERARCHY['hod'], 4);
  assert.equal(ROLE_HIERARCHY['faculty'], 3);
  assert.equal(ROLE_HIERARCHY['staff'], 2);
  assert.equal(ROLE_HIERARCHY['student'], 1);

  assert.ok(ROLE_HIERARCHY['super_admin'] > ROLE_HIERARCHY['principal']);
  assert.ok(ROLE_HIERARCHY['principal'] > ROLE_HIERARCHY['hod']);
  assert.ok(ROLE_HIERARCHY['hod'] > ROLE_HIERARCHY['faculty']);
  assert.ok(ROLE_HIERARCHY['faculty'] > ROLE_HIERARCHY['staff']);
  assert.ok(ROLE_HIERARCHY['staff'] > ROLE_HIERARCHY['student']);
});

test('Department Isolation: Super Admin and Principal have global access', () => {
  const superAdmin = { role: 'super_admin', department: 'dept_A' };
  const principal = { role: 'principal', department: 'dept_A' };

  assert.equal(canAccessDepartment(superAdmin, 'dept_B'), true);
  assert.equal(canAccessDepartment(principal, 'dept_B'), true);
});

test('Department Isolation: HOD and Faculty are strictly scoped to their department', () => {
  const hodCSE = { role: 'hod', department: 'dept_CSE' };
  const facultyCSE = { role: 'faculty', department: 'dept_CSE' };

  // Permitted within own department
  assert.equal(canAccessDepartment(hodCSE, 'dept_CSE'), true);
  assert.equal(canAccessDepartment(facultyCSE, 'dept_CSE'), true);

  // Denied access across other departments
  assert.equal(canAccessDepartment(hodCSE, 'dept_ECE'), false);
  assert.equal(canAccessDepartment(facultyCSE, 'dept_MECH'), false);
});

test('Workload Balancing: Priority weight assignments', () => {
  assert.equal(PRIORITY_WEIGHTS['Low'], 1);
  assert.equal(PRIORITY_WEIGHTS['Medium'], 2);
  assert.equal(PRIORITY_WEIGHTS['High'], 3);
  assert.equal(PRIORITY_WEIGHTS['Critical'], 5);
});

test('Delay-Risk Estimator: Completed tasks evaluate to Low risk (score 0)', () => {
  const completedTask = {
    title: 'Completed Accreditation Document',
    status: 'Completed',
    progress: 100,
    deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    completedAt: new Date(),
  };

  const risk = calculateTaskDelayRisk(completedTask, 0);
  assert.equal(risk.level, 'Low');
  assert.equal(risk.score, 0);
});

test('Delay-Risk Estimator: Overdue unfinished task flags High risk', () => {
  const overdueTask = {
    title: 'Overdue Lab Inspection',
    status: 'In Progress',
    progress: 20,
    startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Overdue by 2 days
    priority: 'Critical',
  };

  const risk = calculateTaskDelayRisk(overdueTask, 0);
  assert.equal(risk.level, 'High');
  assert.ok(risk.score >= 50);
  assert.ok(risk.reasons.some((r) => r.includes('OVERDUE')));
});

test('Delay-Risk Estimator: Task with blocked prerequisites receives dependency penalty', () => {
  const blockedTask = {
    title: 'Cloud Edge Deployment',
    status: 'Blocked',
    progress: 10,
    startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    priority: 'High',
  };

  const riskWithDeps = calculateTaskDelayRisk(blockedTask, 2); // 2 incomplete dependencies
  assert.ok(riskWithDeps.reasons.some((r) => r.includes('Blocked by 2 uncompleted prerequisite')));
});

test('Delay-Risk Estimator: Progress on track results in Low / Moderate risk', () => {
  const onTrackTask = {
    title: 'Syllabus Formatting',
    status: 'In Progress',
    progress: 80,
    startDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    priority: 'Medium',
  };

  const risk = calculateTaskDelayRisk(onTrackTask, 0);
  assert.equal(risk.level, 'Low');
});

