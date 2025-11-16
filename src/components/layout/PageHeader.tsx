import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
          {title}
        </h1>
        {description && <p className="text-slate-600 mt-1 font-medium">{description}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
};

