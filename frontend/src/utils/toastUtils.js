import { toast } from 'react-toastify';

/**
 * Utility functions for toast notifications
 * Centralize toast config để dễ maintain
 */

export const showSuccess = (message) => {
  toast.success(`✅ ${message}`, {
    position: "top-right",
    autoClose: 3000,
  });
};

export const showError = (message) => {
  toast.error(`❌ ${message}`, {
    position: "top-right",
    autoClose: 4000,
  });
};

export const showWarning = (message) => {
  toast.warning(`⚠️ ${message}`, {
    position: "top-right",
    autoClose: 3500,
  });
};

export const showInfo = (message) => {
  toast.info(`ℹ️ ${message}`, {
    position: "top-right",
    autoClose: 3000,
  });
};

// For loading operations
export const showLoading = (message = "Đang xử lý...") => {
  return toast.loading(`⏳ ${message}`, {
    position: "top-right",
  });
};

export const updateToast = (toastId, type, message) => {
  const icon = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  }[type] || '';

  toast.update(toastId, {
    render: `${icon} ${message}`,
    type,
    isLoading: false,
    autoClose: 3000,
  });
};
