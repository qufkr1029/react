import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Header } from './components/Header/Header';
import { ToolGrid } from './components/ToolGrid/ToolGrid';
import { CodeCompare } from './components/CodeCompare/CodeCompare';
import { MarkdownEditor } from './components/MarkdownEditor/MarkdownEditor';
import { CodeFormatter } from './components/CodeFormatter/CodeFormatter';
import { CodeMinifier } from './components/CodeMinifier/CodeMinifier';
import { EncoderDecoder } from './components/EncoderDecoder/EncoderDecoder';
import { Encryption } from './components/Encryption/Encryption';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tool from location pathname
  const getActiveTool = (): string => {
    const path = location.pathname.replace(/^\/+/, '');
    return path || 'dashboard';
  };

  const activeTool = getActiveTool();

  // Sync theme state with body class
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [darkMode]);

  const handleSelectTool = (toolId: string) => {
    navigate(`/${toolId}`);
  };

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="app-shell-index">
      <Header 
        darkMode={darkMode} 
        onToggleTheme={() => setDarkMode(!darkMode)} 
        activeTool={activeTool}
        onBackToDashboard={handleBackToDashboard}
      />

      <main className="content-container-index">
        <Routes>
          <Route path="/" element={<ToolGrid onSelectTool={handleSelectTool} />} />
          <Route path="/compare" element={<CodeCompare />} />
          <Route path="/markdown" element={<MarkdownEditor />} />
          <Route path="/formatter" element={<CodeFormatter />} />
          <Route path="/minifier" element={<CodeMinifier />} />
          <Route path="/encoder" element={<EncoderDecoder />} />
          <Route path="/encryption" element={<Encryption />} />
          {/* Redirect any invalid path to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="app-footer-index">
        <p>© 2026 DevSuite Platform. All tools run client-side for privacy.</p>
      </footer>
    </div>
  );
}

export default App;
