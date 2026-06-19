import React, { useState } from 'react';
import './CodeMinifier.css';

export const CodeMinifier: React.FC = () => {
  const [sourceCode, setSourceCode] = useState<string>('');
  const [minifiedCode, setMinifiedCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('javascript');
  const [removeComments, setRemoveComments] = useState<boolean>(true);
  const [dropConsole, setDropConsole] = useState<boolean>(false);

  const [metrics, setMetrics] = useState({
    originalSize: 0,
    minifiedSize: 0,
    savings: 0,
  });

  const minifyJS = (code: string): string => {
    const strings: string[] = [];
    const stringRegex = /(["'`])(?:\\.|[^\\])*?\1/g;
    
    let temp = code.replace(stringRegex, (match) => {
      strings.push(match);
      return `__STR_M_${strings.length - 1}__`;
    });
    
    if (removeComments) {
      temp = temp.replace(/\/\*[\s\S]*?\*\//g, '');
      temp = temp.replace(/\/\/.*$/gm, '');
    }
    
    if (dropConsole) {
      temp = temp.replace(/console\.(log|debug|info|warn|error|clear)\(([^)]*)\);?/g, '');
    }

    temp = temp.replace(/\s+/g, ' ');
    temp = temp.replace(/\s*([={};:(),[\]+\-*\/<>!|&])\s*/g, '$1');

    let result = temp.replace(/__STR_M_(\d+)__/g, (_, idx) => strings[Number(idx)]);
    return result.trim();
  };

  const minifyCSS = (code: string): string => {
    const strings: string[] = [];
    const stringRegex = /(["'])(?:\\.|[^\\])*?\1/g;
    
    let temp = code.replace(stringRegex, (match) => {
      strings.push(match);
      return `__STR_M_${strings.length - 1}__`;
    });

    if (removeComments) {
      temp = temp.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    temp = temp.replace(/\s+/g, ' ');
    temp = temp.replace(/\s*([{}::;,>\+])\s*/g, '$1');

    let result = temp.replace(/__STR_M_(\d+)__/g, (_, idx) => strings[Number(idx)]);
    return result.trim();
  };

  const minifyJSON = (code: string): string => {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed);
    } catch (err: any) {
      return `[JSON Parsing Error]: ${err.message}`;
    }
  };

  const handleMinify = () => {
    if (!sourceCode.trim()) return;

    let compressed: string;
    if (language === 'javascript') {
      compressed = minifyJS(sourceCode);
    } else if (language === 'css') {
      compressed = minifyCSS(sourceCode);
    } else if (language === 'json') {
      compressed = minifyJSON(sourceCode);
    } else {
      compressed = sourceCode.replace(/\s+/g, ' ').trim();
    }

    const origBytes = new Blob([sourceCode]).size;
    const miniBytes = new Blob([compressed]).size;
    const savings = origBytes ? Number(((origBytes - miniBytes) / origBytes * 100).toFixed(2)) : 0;

    setMetrics({
      originalSize: origBytes,
      minifiedSize: miniBytes,
      savings: savings >= 0 ? savings : 0,
    });
    setMinifiedCode(compressed);
  };

  const handleClear = () => {
    setSourceCode('');
    setMinifiedCode('');
    setMetrics({ originalSize: 0, minifiedSize: 0, savings: 0 });
  };

  return (
    <div className="tool-workspace">
      <div className="workspace-header">
        <div className="workspace-title-area">
          <h2>코드 압축 (Code Minifier)</h2>
          <p className="workspace-desc">주석과 공백을 지우고 변수명을 축소하여 웹 자산의 크기를 압축합니다.</p>
        </div>
      </div>

      <div className="minifier-grid">
        {/* Main code fields */}
        <div className="minifier-main">
          <div className="panel-card-header">
            <span>입력 코드 (Source)</span>
            <button className="btn-text-action" onClick={handleClear}>지우기</button>
          </div>
          <div className="code-editor-wrapper text-area-large">
            <textarea 
              className="code-textarea monospace-font" 
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              placeholder="압축할 소스코드를 여기에 입력하세요..."
            />
          </div>

          <div className="spacer-y" />

          <div className="panel-card-header">
            <span>압축 결과 (Minified)</span>
          </div>
          <div className="code-editor-wrapper text-area-large">
            <textarea 
              className="code-textarea monospace-font readonly-editor" 
              readOnly
              value={minifiedCode}
              placeholder="압축된 코드가 여기에 출력됩니다..."
            />
          </div>
        </div>

        {/* Sidebar panels */}
        <div className="minifier-sidebar">
          {/* Stats frame */}
          <div className="metric-box-container">
            <h3 className="options-title">압축 통계</h3>
            
            <div className="metric-row">
              <span className="metric-label">원본 크기</span>
              <span className="metric-value">{metrics.originalSize} Bytes</span>
            </div>
            
            <div className="metric-row">
              <span className="metric-label">압축 후 크기</span>
              <span className="metric-value text-teal">{metrics.minifiedSize} Bytes</span>
            </div>

            <div className="metric-row line-top">
              <span className="metric-label">압축율 (Savings)</span>
              <span className="metric-value highlight-text">{metrics.savings}%</span>
            </div>

            {/* Savings gauge placeholder */}
            <div className="meter-container">
              <div className="meter-bar" style={{ width: `${metrics.savings}%` }} />
            </div>
          </div>

          {/* Config options */}
          <div className="options-panel no-margin">
            <h3 className="options-title">압축 설정</h3>
            
            <div className="option-item">
              <label className="option-label">압축 대상 언어</label>
              <select 
                className="select-input full-width" 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="javascript">JavaScript / ES6</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div className="option-item checkbox-item">
              <input 
                type="checkbox" 
                id="minifyComments" 
                checked={removeComments} 
                onChange={(e) => setRemoveComments(e.target.checked)}
              />
              <label htmlFor="minifyComments">주석 제거</label>
            </div>

            {language === 'javascript' && (
              <div className="option-item checkbox-item">
                <input 
                  type="checkbox" 
                  id="minifyConsole" 
                  checked={dropConsole} 
                  onChange={(e) => setDropConsole(e.target.checked)}
                />
                <label htmlFor="minifyConsole">console.log 호출 제거</label>
              </div>
            )}
          </div>

          <button className="btn-primary-gradient full-width btn-minify-action" onClick={handleMinify}>
            코드 압축 실행
          </button>
        </div>
      </div>
    </div>
  );
};
