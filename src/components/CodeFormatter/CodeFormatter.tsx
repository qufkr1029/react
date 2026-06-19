import React, { useState } from 'react';
import './CodeFormatter.css';

export const CodeFormatter: React.FC = () => {
  const [sourceCode, setSourceCode] = useState<string>('');
  const [formattedCode, setFormattedCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('javascript');
  const [indentStyle, setIndentStyle] = useState<'spaces' | 'tabs'>('spaces');
  const [indentSize, setIndentSize] = useState<number>(2);
  const [useSemicolon, setUseSemicolon] = useState<boolean>(true);
  const [useSingleQuotes, setUseSingleQuotes] = useState<boolean>(true);

  // Pure formatter protecting string literals
  const formatCode = (code: string): string => {
    if (!code.trim()) return '';

    const char = indentStyle === 'spaces' ? ' '.repeat(indentSize) : '\t';

    if (language === 'json') {
      try {
        const parsed = JSON.parse(code);
        return JSON.stringify(parsed, null, char);
      } catch (err: any) {
        return `[JSON Error]: ${err.message}`;
      }
    }

    try {
      const strings: string[] = [];
      const stringRegex = /(["'`])(?:\\.|[^\\])*?\1/g;
      
      let tempCode = code.replace(stringRegex, (match) => {
        strings.push(match);
        return `__STR_PLACEHOLDER_${strings.length - 1}__`;
      });

      let formatted = '';
      let indentLevel = 0;
      
      const lines = tempCode
        .replace(/([{}])/g, '\n$1\n')
        .replace(/([;])/g, '$1\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (line.startsWith('}') || line.startsWith(']')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        formatted += char.repeat(indentLevel) + line + '\n';

        if (line.endsWith('{') || line.endsWith('[')) {
          indentLevel++;
        }
      }

      let result = formatted.trim();

      if (!useSemicolon) {
        result = result.replace(/;\n/g, '\n').replace(/;$/g, '');
      }

      result = result.replace(/__STR_PLACEHOLDER_(\d+)__/g, (_, idx) => {
        let str = strings[Number(idx)];
        if (useSingleQuotes) {
          if (str.startsWith('"') && str.endsWith('"') && !str.includes("'")) {
            str = "'" + str.slice(1, -1) + "'";
          }
        } else {
          if (str.startsWith("'") && str.endsWith("'") && !str.includes('"')) {
            str = '"' + str.slice(1, -1) + '"';
          }
        }
        return str;
      });

      return result;
    } catch (err: any) {
      return `[Formatting Error]: ${err.message}`;
    }
  };

  const handleFormat = () => {
    setFormattedCode(formatCode(sourceCode));
  };

  const handleClear = () => {
    setSourceCode('');
    setFormattedCode('');
  };

  return (
    <div className="tool-workspace">
      <div className="workspace-header">
        <div className="workspace-title-area">
          <h2>코드 정렬 (Code Formatter)</h2>
          <p className="workspace-desc">지저분한 소스코드를 정해진 규칙에 맞춰 깔끔하게 정렬하고 줄 바꿈을 적용합니다.</p>
        </div>
      </div>

      <div className="formatter-layout">
        {/* Left Option Sidebar */}
        <div className="options-panel">
          <h3 className="options-title">옵션 설정</h3>
          
          <div className="option-item">
            <label className="option-label">대상 언어</label>
            <select 
              className="select-input full-width" 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="javascript">JavaScript</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div className="option-item">
            <label className="option-label">들여쓰기 스타일</label>
            <div className="segmented-control full-width">
              <button 
                className={indentStyle === 'spaces' ? 'active' : ''} 
                onClick={() => setIndentStyle('spaces')}
              >
                Spaces
              </button>
              <button 
                className={indentStyle === 'tabs' ? 'active' : ''} 
                onClick={() => setIndentStyle('tabs')}
              >
                Tabs
              </button>
            </div>
          </div>

          <div className="option-item">
            <label className="option-label">들여쓰기 크기</label>
            <select 
              className="select-input full-width"
              value={indentSize}
              onChange={(e) => setIndentSize(Number(e.target.value))}
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
              <option value="8">8 Spaces</option>
            </select>
          </div>

          {language === 'javascript' && (
            <>
              <div className="option-item checkbox-item">
                <input 
                  type="checkbox" 
                  id="semicolons" 
                  checked={useSemicolon}
                  onChange={(e) => setUseSemicolon(e.target.checked)}
                />
                <label htmlFor="semicolons">세미콜론 사용 (;)</label>
              </div>

              <div className="option-item checkbox-item">
                <input 
                  type="checkbox" 
                  id="singleQuotes" 
                  checked={useSingleQuotes}
                  onChange={(e) => setUseSingleQuotes(e.target.checked)}
                />
                <label htmlFor="singleQuotes">홑따옴표 사용 ('')</label>
              </div>
            </>
          )}
        </div>

        {/* Right Input/Output Editors */}
        <div className="formatter-editors">
          <div className="editor-container-half">
            <div className="panel-card-header">
              <span>입력 코드 (Source)</span>
              <button className="btn-text-action" onClick={handleClear}>지우기</button>
            </div>
            <div className="code-editor-wrapper">
              <textarea 
                className="code-textarea monospace-font" 
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                placeholder="정렬할 소스코드를 여기에 붙여넣으세요..."
              />
            </div>
          </div>

          <div className="editor-container-half">
            <div className="panel-card-header">
              <span>정렬 결과 (Result)</span>
            </div>
            <div className="code-editor-wrapper">
              <textarea 
                className="code-textarea monospace-font readonly-editor" 
                readOnly
                value={formattedCode}
                placeholder="정렬된 결과가 여기에 나타납니다..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="workspace-footer-actions justify-right">
        <button className="btn-primary-gradient" onClick={handleFormat}>코드 정렬 실행</button>
      </div>
    </div>
  );
};
