import React from 'react';

interface ScheduleGridContainerProps {
  children: React.ReactNode;
}

export default function ScheduleGridContainer({ children }: ScheduleGridContainerProps) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '1.5rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minWidth: '100%',
        boxSizing: 'border-box',
        display: 'inline-block',
      }}
    >
      {children}
    </div>
  );
}

