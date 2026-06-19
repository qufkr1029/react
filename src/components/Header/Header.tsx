import React from 'react';
import { SunIcon, MoonIcon } from '../Icons/SvgIcons';
import './Header.css';

interface HeaderProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  activeTool: string;
  onBackToDashboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  darkMode, 
  onToggleTheme,
  activeTool,
  onBackToDashboard
}) => {
  return (
    <header className="app-header-index">
      <div className="logo-section-index" onClick={onBackToDashboard} style={{ cursor: 'pointer' }}>
        <span className="logo-symbol">🚀</span>
        <div className="logo-text">
          <h2>DevSuite</h2>
          <span>Developer Tools</span>
        </div>
      </div>

      {activeTool !== 'dashboard' && (
        <button className="btn-back-link" onClick={onBackToDashboard}>
          ← 도구 목록으로 가기
        </button>
      )}

      <div className="header-actions">
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
        >
          {darkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </button>
      </div>
    </header>
  );
};
