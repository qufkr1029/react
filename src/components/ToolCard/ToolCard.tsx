import React from 'react';
import './ToolCard.css';

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  tag: string;
  color: string;
  isReady?: boolean;
  onClick?: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  icon,
  tag,
  color,
  isReady = true,
  onClick
}) => {
  return (
    <div 
      className={`tool-card border-hover-${color} ${!isReady ? 'is-disabled' : ''}`} 
      onClick={isReady ? onClick : undefined} 
      style={{ cursor: isReady && onClick ? 'pointer' : 'default' }}
    >
      {!isReady && (
        <div className="card-overlay-coming-soon">
          <span>준비중...</span>
        </div>
      )}
      <div className="tool-card-header">
        <div className={`tool-icon-wrapper bg-${color}`}>
          {icon}
        </div>
        <span className={`tool-tag tag-${color}`}>{tag}</span>
      </div>
      <div className="tool-card-body">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="tool-card-footer">
        <span className="action-text">{isReady ? '도구 바로가기' : '준비 중'}</span>
      </div>
    </div>
  );
};
