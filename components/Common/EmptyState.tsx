import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📋',
  title,
  description,
  actionText,
  onAction,
  className = ''
}) => {
  return (
    <div
      className={`py-12 px-4 text-center rounded-xl bg-gray-50/60 dark:bg-dark-bg/40 border border-dashed border-gray-300 dark:border-gray-700 my-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-2xl flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 bg-primary text-white hover:bg-primary/90 text-xs font-semibold py-2 px-4 rounded-lg shadow-sm transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
