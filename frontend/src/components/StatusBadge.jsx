import React from 'react';
import PropTypes from 'prop-types';
import { getStatusBadge } from '../utils/borrowUtils';

/**
 * StatusBadge Component
 * Displays status with appropriate color and icon
 */
const StatusBadge = ({ status, className = '' }) => {
  const badge = getStatusBadge(status);

  return (
    <span 
      className={`px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-1 ${badge.color} ${className}`}
    >
      <span>{badge.icon}</span>
      <span>{badge.text.replace(/^[^\w\s]+\s*/, '')}</span> {/* Remove leading emoji */}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['pending', 'accepted', 'rejected', 'returned']).isRequired,
  className: PropTypes.string
};

export default StatusBadge;
