const { PRIORITY_LEVELS } = require('../config/constants');

class PriorityService {
  /**
   * Determine priority based on category baseline, AI confidence/severity, description keywords, and duplicate volume
   */
  calculatePriority({ categoryDefaultPriority, aiSeverityTag, description = '', duplicateCount = 0 }) {
    let score = 2; // Default Medium

    // Base on category priority
    switch (categoryDefaultPriority) {
      case PRIORITY_LEVELS.LOW:
        score = 1;
        break;
      case PRIORITY_LEVELS.MEDIUM:
        score = 2;
        break;
      case PRIORITY_LEVELS.HIGH:
        score = 3;
        break;
      case PRIORITY_LEVELS.CRITICAL:
        score = 4;
        break;
      default:
        score = 2;
    }

    // High urgency keywords in citizen description
    const descLower = description.toLowerCase();
    const urgentKeywords = ['danger', 'emergency', 'accident', 'spark', 'flood', 'blocked completely', 'injury', 'hospital', 'school', 'severe'];
    const hasUrgentKeyword = urgentKeywords.some((kw) => descLower.includes(kw));

    if (hasUrgentKeyword) {
      score = Math.min(4, score + 1);
    }

    // Duplicate report volume multiplier (more citizens reporting = higher civic impact)
    if (duplicateCount >= 5) {
      score = 4; // Escalate to CRITICAL
    } else if (duplicateCount >= 2 && score < 3) {
      score = 3; // Escalate to HIGH
    }

    // Map score back to Priority Level
    if (score >= 4) return PRIORITY_LEVELS.CRITICAL;
    if (score === 3) return PRIORITY_LEVELS.HIGH;
    if (score === 2) return PRIORITY_LEVELS.MEDIUM;
    return PRIORITY_LEVELS.LOW;
  }
}

module.exports = new PriorityService();
