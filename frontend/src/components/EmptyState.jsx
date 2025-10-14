import React from 'react';
import PropTypes from 'prop-types';

/**
 * EmptyState Component
 * Reusable component for displaying empty states with icon, title, and description
 */
const EmptyState = ({ icon, title, description, action }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-12 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <p className="text-xl text-gray-600 mb-2">{title}</p>
      <p className="text-gray-500 mb-4">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  action: PropTypes.node
};

export default EmptyState;
