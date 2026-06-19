import React, { useState } from 'react';
import { CopyIcon, RefreshIcon } from '../Icons/SvgIcons';
import './CodeCompare.css';

interface DiffResult {
  type: 'added' | 'removed' | 'equal';
  value: string;
  originalLineNum?: number;
  modifiedLineNum?: number;
}

interface VisualLine {
  original: {
    type: 'removed' | 'equal' | 'empty';
    lineNum?: number;
    value?: string;
  };
  modified: {
    type: 'added' | 'equal' | 'empty';
    lineNum?: number;
    value?: string;
  };
}

export const CodeCompare: React.FC = () => {
  const [originalText, setOriginalText] = useState<string>('');
  const [modifiedText, setModifiedText] = useState<string>('');

  const [alignedResults, setAlignedResults] = useState<VisualLine[]>([]);
  const [hasCompared, setHasCompared] = useState<boolean>(false);

  // Copy status feedback states
  const [origCopyLabel, setOrigCopyLabel] = useState<string>('복사');
  const [modCopyLabel, setModCopyLabel] = useState<string>('복사');

  // Copy logic
  const handleCopy = (text: string, setLabel: React.Dispatch<React.SetStateAction<string>>) => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text).then(() => {
      setLabel('복사됨!');
      setTimeout(() => setLabel('복사'), 1500);
    });
  };

  // Align side-by-side lines to keep matching codes horizontally aligned
  const alignDiffs = (rawDiffs: DiffResult[]): VisualLine[] => {
    const aligned: VisualLine[] = [];
    let idx = 0;
    const len = rawDiffs.length;

    while (idx < len) {
      if (rawDiffs[idx].type === 'equal') {
        aligned.push({
          original: { type: 'equal', lineNum: rawDiffs[idx].originalLineNum, value: rawDiffs[idx].value },
          modified: { type: 'equal', lineNum: rawDiffs[idx].modifiedLineNum, value: rawDiffs[idx].value }
        });
        idx++;
        continue;
      }

      const removedBlock: DiffResult[] = [];
      const addedBlock: DiffResult[] = [];

      while (idx < len && rawDiffs[idx].type === 'removed') {
        removedBlock.push(rawDiffs[idx]);
        idx++;
      }

      while (idx < len && rawDiffs[idx].type === 'added') {
        addedBlock.push(rawDiffs[idx]);
        idx++;
      }

      const maxLen = Math.max(removedBlock.length, addedBlock.length);
      for (let k = 0; k < maxLen; k++) {
        const rem = removedBlock[k];
        const add = addedBlock[k];

        aligned.push({
          original: rem 
            ? { type: 'removed', lineNum: rem.originalLineNum, value: rem.value }
            : { type: 'empty' },
          modified: add
            ? { type: 'added', lineNum: add.modifiedLineNum, value: add.value }
            : { type: 'empty' }
        });
      }
    }

    return aligned;
  };

  const computeDiff = (origStr?: string, modStr?: string) => {
    const text1 = (typeof origStr === 'string' ? origStr : originalText).replace(/\r\n/g, '\n');
    const text2 = (typeof modStr === 'string' ? modStr : modifiedText).replace(/\r\n/g, '\n');

    if (!text1.trim() && !text2.trim()) return;

    const one = text1.split('\n');
    const two = text2.split('\n');
    const n = one.length;
    const m = two.length;

    const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (one[i - 1] === two[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const result: DiffResult[] = [];
    let i = n;
    let j = m;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && one[i - 1] === two[j - 1]) {
        result.unshift({
          type: 'equal',
          value: one[i - 1],
          originalLineNum: i,
          modifiedLineNum: j
        });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({
          type: 'added',
          value: two[j - 1],
          modifiedLineNum: j
        });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        result.unshift({
          type: 'removed',
          value: one[i - 1],
          originalLineNum: i
        });
        i--;
      }
    }

    setAlignedResults(alignDiffs(result));
    setHasCompared(true);
  };

  const handleReset = () => {
    setOriginalText('');
    setModifiedText('');
    setAlignedResults([]);
    setHasCompared(false);
  };

  const handleLoadExample = () => {
    const exampleOrig = 
`const user = {
  name: "John Doe",
  age: 30,
  role: "developer",
  skills: ["React", "CSS"]
};

function greet(user) {
  console.log("Hello, " + user.name);
}`;

    const exampleMod = 
`const user = {
  name: "John D2oe",
  age: 31, // Happy Birthday!
  role: "lead-developer",
  skills: ["React", "CSS", "TypeScript"],
  active: true
};

const greet = (user) => {
  console.log(\`Hello, \${user.name}!\\n\`);
};`;

    setOriginalText(exampleOrig);
    setModifiedText(exampleMod);
    
    // Auto-run compare on example loading for better UX
    computeDiff(exampleOrig, exampleMod);
  };

  return (
    <div className="tool-workspace">
      <div className="workspace-header">
        <div className="workspace-title-area">
          <h2>코드 비교 (Code Compare)</h2>
          <p className="workspace-desc">두 개의 텍스트나 소스코드를 나란히 두고 라인별 차이점을 강조하여 비교합니다.</p>
        </div>
        <div className="workspace-actions">
          <button className="btn-secondary" onClick={handleLoadExample}>
            <RefreshIcon size={14} /> 예제 로드
          </button>
        </div>
      </div>

      {/* Editor Panels */}
      <div className="compare-inputs-grid">
        <div className="compare-input-card">
          <div className="panel-card-header">
            <span>원본 코드 (Original)</span>
            <div className="panel-header-actions">
              <button className="btn-text-action action-copy" onClick={() => handleCopy(originalText, setOrigCopyLabel)}>
                <CopyIcon size={12} /> {origCopyLabel}
              </button>
              <span className="divider">|</span>
              <button className="btn-text-action" onClick={() => setOriginalText('')}>지우기</button>
            </div>
          </div>
          <div className="code-editor-wrapper">
            <textarea
              className="code-textarea"
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="비교할 원본 코드를 입력하세요..."
            />
          </div>
        </div>

        <div className="compare-input-card">
          <div className="panel-card-header">
            <span>수정된 코드 (Modified)</span>
            <div className="panel-header-actions">
              <button className="btn-text-action action-copy" onClick={() => handleCopy(modifiedText, setModCopyLabel)}>
                <CopyIcon size={12} /> {modCopyLabel}
              </button>
              <span className="divider">|</span>
              <button className="btn-text-action" onClick={() => setModifiedText('')}>지우기</button>
            </div>
          </div>
          <div className="code-editor-wrapper">
            <textarea
              className="code-textarea"
              value={modifiedText}
              onChange={(e) => setModifiedText(e.target.value)}
              placeholder="비교할 수정된 코드를 입력하세요..."
            />
          </div>
        </div>
      </div>

      {/* Execute actions (aligned to the right) */}
      <div className="workspace-footer-actions justify-right">
        <button className="btn-secondary" onClick={handleReset}>초기화</button>
        <button className="btn-primary-gradient" onClick={() => computeDiff()}>코드 비교 실행</button>
      </div>

      {/* Results View */}
      {hasCompared && (
        <div className="compare-results-section">
          <h3 className="results-title">비교 분석 결과</h3>
          
          <div className="side-by-side-diff-container">
            {/* Left pane: Original */}
            <div className="diff-pane">
              <div className="pane-header">Original</div>
              <div className="diff-content">
                {alignedResults.map((row, idx) => {
                  if (row.original.type === 'empty') {
                    return <div key={idx} className="diff-line line-empty">&nbsp;</div>;
                  }
                  
                  const isRemoved = row.original.type === 'removed';
                  
                  return (
                    <div key={idx} className={`diff-line ${isRemoved ? 'line-removed' : 'line-equal'}`}>
                      <span className="ln">{row.original.lineNum}</span>
                      <span className="diff-marker">{isRemoved ? '-' : ' '}</span>
                      <code className="code-text">{row.original.value || ' '}</code>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right pane: Modified */}
            <div className="diff-pane">
              <div className="pane-header">Modified</div>
              <div className="diff-content">
                {alignedResults.map((row, idx) => {
                  if (row.modified.type === 'empty') {
                    return <div key={idx} className="diff-line line-empty">&nbsp;</div>;
                  }
                  
                  const isAdded = row.modified.type === 'added';
                  
                  return (
                    <div key={idx} className={`diff-line ${isAdded ? 'line-added' : 'line-equal'}`}>
                      <span className="ln">{row.modified.lineNum}</span>
                      <span className="diff-marker">{isAdded ? '+' : ' '}</span>
                      <code className="code-text">{row.modified.value || ' '}</code>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
