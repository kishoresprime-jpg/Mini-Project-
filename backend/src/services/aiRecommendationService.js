const User = require('../models/User');
const Task = require('../models/Task');

/**
 * Intelligent Task Assignment Engine
 * Uses a multi-criteria scoring function with transparent, explainable factors:
 * 1. Skill Match Score (up to 40 pts)
 * 2. Workload & Availability Score (up to 30 pts)
 * 3. Historical Completion Score (up to 20 pts)
 * 4. Role & Department Suitability (up to 10 pts)
 */
const recommendAssignees = async ({ taskId, departmentId, requiredSkills = [], priority = 'Medium', targetRoles = ['faculty', 'staff'] }) => {
  // Query candidate users in the relevant department
  const query = {
    isActive: true,
  };

  if (departmentId) {
    query.department = departmentId;
  }

  if (targetRoles && targetRoles.length > 0) {
    query.role = { $in: targetRoles };
  }

  const candidates = await User.find(query).populate('department', 'name code').lean();

  if (!candidates || candidates.length === 0) {
    return {
      recommendations: [],
      method: 'multi_criteria_scoring_model',
      message: 'No eligible candidates found for the specified department and roles.',
    };
  }

  // Get active tasks counts for each candidate
  const candidateIds = candidates.map((c) => c._id);
  const activeTasks = await Task.aggregate([
    {
      $match: {
        assignedTo: { $in: candidateIds },
        status: { $in: ['To Do', 'In Progress', 'Submitted for Review', 'Blocked'] },
      },
    },
    {
      $group: {
        _id: '$assignedTo',
        count: { $sum: 1 },
        highPriorityCount: {
          $sum: { $cond: [{ $in: ['$priority', ['High', 'Critical']] }, 1, 0] },
        },
      },
    },
  ]);

  const activeTaskMap = {};
  activeTasks.forEach((item) => {
    activeTaskMap[item._id.toString()] = item;
  });

  const scoredCandidates = candidates.map((user) => {
    let score = 0;
    const reasons = [];
    const skillList = user.skills || [];
    const lowerUserSkills = skillList.map((s) => s.toLowerCase().trim());
    const lowerReqSkills = requiredSkills.map((s) => s.toLowerCase().trim());

    // 1. Skill Match (Max 40 points)
    let matchedSkills = [];
    if (lowerReqSkills.length > 0) {
      matchedSkills = lowerReqSkills.filter((reqSkill) =>
        lowerUserSkills.some((uSkill) => uSkill.includes(reqSkill) || reqSkill.includes(uSkill))
      );
      const matchRatio = matchedSkills.length / lowerReqSkills.length;
      const skillScore = Math.round(matchRatio * 40);
      score += skillScore;

      if (matchedSkills.length > 0) {
        reasons.push(
          `Matches ${matchedSkills.length}/${lowerReqSkills.length} required skills (${matchedSkills.join(', ')}) (+${skillScore} pts)`
        );
      } else {
        reasons.push('No direct skill keyword match (+0 pts)');
      }
    } else {
      score += 25; // default neutral if no specific skills specified
      reasons.push('General skill compatibility verified (+25 pts)');
    }

    // 2. Workload & Availability (Max 30 points)
    const activeData = activeTaskMap[user._id.toString()] || { count: 0, highPriorityCount: 0 };
    const activeCount = activeData.count;

    let workloadScore = 0;
    if (activeCount === 0) {
      workloadScore = 30;
      reasons.push(`Optimal availability: 0 active tasks currently assigned (+30 pts)`);
    } else if (activeCount <= 2) {
      workloadScore = 24;
      reasons.push(`Light workload: ${activeCount} active task(s) (+24 pts)`);
    } else if (activeCount <= 4) {
      workloadScore = 16;
      reasons.push(`Moderate workload: ${activeCount} active tasks (+16 pts)`);
    } else if (activeCount <= 6) {
      workloadScore = 8;
      reasons.push(`High workload: ${activeCount} active tasks (+8 pts)`);
    } else {
      workloadScore = 2;
      reasons.push(`Heavy workload: ${activeCount} active tasks (+2 pts)`);
    }

    if (activeData.highPriorityCount > 2) {
      workloadScore = Math.max(0, workloadScore - 5);
      reasons.push(`Penalty: Already managing ${activeData.highPriorityCount} critical/high priority tasks (-5 pts)`);
    }
    score += workloadScore;

    // 3. Historical Completion Record (Max 20 points)
    const completedCount = user.completedTasksCount || 0;
    let completionScore = 0;
    if (completedCount >= 10) {
      completionScore = 20;
      reasons.push(`High reliability: Track record of ${completedCount} successfully completed tasks (+20 pts)`);
    } else if (completedCount >= 5) {
      completionScore = 14;
      reasons.push(`Proven experience: ${completedCount} completed tasks (+14 pts)`);
    } else if (completedCount >= 1) {
      completionScore = 8;
      reasons.push(`Active contributor: ${completedCount} completed tasks (+8 pts)`);
    } else {
      completionScore = 5;
      reasons.push('New or developing track record (+5 pts)');
    }
    score += completionScore;

    // 4. Role & Priority Alignment (Max 10 points)
    let roleScore = 0;
    if (priority === 'Critical' || priority === 'High') {
      if (user.role === 'faculty') {
        roleScore = 10;
        reasons.push('Senior academic personnel well suited for high-priority deliverable (+10 pts)');
      } else {
        roleScore = 7;
        reasons.push('Capable team member for prioritized task (+7 pts)');
      }
    } else {
      roleScore = 8;
      reasons.push('Well aligned with task scope and complexity (+8 pts)');
    }
    score += roleScore;

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        skills: user.skills,
        completedTasksCount: user.completedTasksCount,
        activeTasksCount: activeCount,
      },
      score: Math.min(100, Math.max(0, score)),
      reasons,
      matchedSkills,
      activeTasksCount: activeCount,
    };
  });

  // Sort descending by score
  scoredCandidates.sort((a, b) => b.score - a.score);

  return {
    recommendations: scoredCandidates,
    method: 'explainable_multi_criteria_engine',
    isRuleBased: true,
    modelDescription: 'Multi-criteria heuristic ranking based on skill overlap, active task saturation, priority weighting, and completion history.',
  };
};

module.exports = {
  recommendAssignees,
};

