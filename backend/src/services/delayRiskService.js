const Task = require('../models/Task');

/**
 * Calculates explainable delay-risk for a specific task or a collection of tasks.
 */
const calculateTaskDelayRisk = (task, incompleteDependencyCount = 0) => {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const startDate = task.startDate ? new Date(task.startDate) : new Date(task.createdAt || now);
  const progress = task.progress || 0;

  // If task is completed or approved, risk is 0 / Low
  if (task.status === 'Completed' || task.status === 'Approved') {
    return {
      level: 'Low',
      score: 0,
      reasons: ['Task is already verified and concluded.'],
      recommendedAction: 'No action required; task finished.',
      expectedCompletionDate: task.completedAt || null,
      isRuleBased: true,
      lastEvaluatedAt: new Date(),
    };
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilDeadline = (deadline - now) / msPerDay;
  const totalDurationDays = Math.max(1, (deadline - startDate) / msPerDay);
  const elapsedDays = Math.max(0, (now - startDate) / msPerDay);

  // Expected progress based on linear timeline elapsed
  const expectedProgress = Math.min(100, Math.round((elapsedDays / totalDurationDays) * 100));
  const progressGap = expectedProgress - progress;

  let riskScore = 0;
  const reasons = [];
  const correctiveActions = [];

  // 1. Deadline overdue check
  if (daysUntilDeadline < 0) {
    const overdueDays = Math.abs(Math.round(daysUntilDeadline));
    riskScore += 50;
    reasons.push(`Task is OVERDUE by ${overdueDays} day(s).`);
    correctiveActions.push('Immediately escalate to HOD / Project Manager to negotiate deadline extension or reassign.');
  } else if (daysUntilDeadline <= 2) {
    riskScore += 35;
    reasons.push(`Deadline is within 48 hours (${daysUntilDeadline.toFixed(1)} days remaining).`);
    correctiveActions.push('Prioritize immediately over other assignments.');
  } else if (daysUntilDeadline <= 5) {
    riskScore += 20;
    reasons.push(`Approaching deadline in ${Math.round(daysUntilDeadline)} days.`);
  }

  // 2. Progress vs Expected Progress
  if (progressGap > 40) {
    riskScore += 30;
    reasons.push(`Critical progress deficit: Current progress is ${progress}%, while schedule expects ${expectedProgress}% (${progressGap}% behind).`);
    correctiveActions.push('Break remaining work into smaller daily milestones and allocate assistant staff.');
  } else if (progressGap > 20) {
    riskScore += 18;
    reasons.push(`Moderate progress lag: Behind expected progress by ${progressGap}%.`);
    correctiveActions.push('Review blockers with assignee during daily check-in.');
  } else if (progress === 0 && elapsedDays > 3) {
    riskScore += 15;
    reasons.push(`Task has not yet been started despite ${Math.round(elapsedDays)} days elapsed.`);
    correctiveActions.push('Ensure assignee has received necessary instructions and resources.');
  }

  // 3. Blocked Dependencies
  if (incompleteDependencyCount > 0) {
    const depPenalty = Math.min(30, incompleteDependencyCount * 15);
    riskScore += depPenalty;
    reasons.push(`Blocked by ${incompleteDependencyCount} uncompleted prerequisite task(s).`);
    correctiveActions.push('Accelerate completion of prerequisite dependencies before resuming.');
  }

  // 4. Priority impact
  if (task.priority === 'Critical') {
    riskScore += 15;
    reasons.push('High-stakes critical task: any delay will impact milestone delivery.');
  } else if (task.priority === 'High') {
    riskScore += 8;
  }

  // Final level determination
  const finalScore = Math.min(100, Math.max(5, riskScore));
  let level = 'Low';
  if (finalScore >= 60 || daysUntilDeadline < 0) {
    level = 'High';
  } else if (finalScore >= 35) {
    level = 'Medium';
  }

  if (reasons.length === 0) {
    reasons.push('Task is progressing smoothly according to planned schedule.');
    correctiveActions.push('Continue regular execution.');
  }

  // Calculate defensible expected completion date if reasonable velocity exists
  let expectedCompletionDate = null;
  if (progress > 5 && elapsedDays > 0) {
    const progressRatePerDay = progress / elapsedDays;
    const remainingProgress = 100 - progress;
    const estimatedDaysRemaining = remainingProgress / Math.max(progressRatePerDay, 0.5);
    expectedCompletionDate = new Date(now.getTime() + estimatedDaysRemaining * msPerDay);
  } else {
    // If no progress, estimate from deadline plus deficit
    if (daysUntilDeadline < 0) {
      expectedCompletionDate = new Date(now.getTime() + 3 * msPerDay);
    }
  }

  return {
    level,
    score: finalScore,
    reasons,
    recommendedAction: correctiveActions.join(' '),
    expectedCompletionDate,
    isRuleBased: true,
    lastEvaluatedAt: new Date(),
  };
};

/**
 * Evaluates and updates delay risk for a task in the database.
 */
const evaluateTaskRisk = async (taskId) => {
  const task = await Task.findById(taskId).populate('dependencies');
  if (!task) return null;

  let incompleteDepCount = 0;
  if (task.dependencies && task.dependencies.length > 0) {
    incompleteDepCount = task.dependencies.filter(
      (dep) => dep.status !== 'Completed' && dep.status !== 'Approved'
    ).length;
  }

  const riskAssessment = calculateTaskDelayRisk(task, incompleteDepCount);
  task.delayRisk = riskAssessment;
  await task.save();

  return riskAssessment;
};

/**
 * Bulk recalculation of delay risks across active tasks
 */
const evaluateAllActiveTasks = async (departmentId = null) => {
  const query = {
    status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] },
  };
  if (departmentId) {
    query.department = departmentId;
  }

  const tasks = await Task.find(query).populate('dependencies');
  const results = [];

  for (const task of tasks) {
    const incompleteDepCount = (task.dependencies || []).filter(
      (dep) => dep.status !== 'Completed' && dep.status !== 'Approved'
    ).length;

    const riskAssessment = calculateTaskDelayRisk(task, incompleteDepCount);
    task.delayRisk = riskAssessment;
    await task.save();
    results.push({ taskId: task._id, risk: riskAssessment });
  }

  return results;
};

module.exports = {
  calculateTaskDelayRisk,
  evaluateTaskRisk,
  evaluateAllActiveTasks,
};

