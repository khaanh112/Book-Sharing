import React from 'react';
import PropTypes from 'prop-types';
import { getDaysLeft, getDueDateUrgency, formatDueDate } from '../utils/borrowUtils';

/**
 * DueDateBadge Component
 * Displays due date with appropriate styling based on urgency
 */
const DueDateBadge = ({ dueDate, className = '' }) => {
  if (!dueDate) return null;

  const urgency = getDueDateUrgency(dueDate);
  const formatted = formatDueDate(dueDate);
  
  const urgencyColors = {
    overdue: 'bg-red-100 text-red-700 border-red-300',
    urgent: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    normal: 'bg-green-100 text-green-700 border-green-300'
  };

  const urgencyIcons = {
    overdue: '🚨',
    urgent: '⏰',
    normal: '📅'
  };

  return (
    <div className={`px-3 py-2 rounded-lg border-2 text-sm font-medium ${urgencyColors[urgency]} ${className}`}>
      <span className="mr-1">{urgencyIcons[urgency]}</span>
      {formatted}
    </div>
  );
};

DueDateBadge.propTypes = {
  dueDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
  className: PropTypes.string
};

export default DueDateBadge;
