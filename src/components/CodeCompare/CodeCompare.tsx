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

interface DiffToken {
  type: 'added' | 'removed' | 'equal';
  value: string;
}

const tokenize = (text: string): string[] => {
  return text.match(/[a-zA-Z0-9_]+|\s+|[^a-zA-Z0-9_\s]/g) || [];
};

const diffTokens = (originalVal: string, modifiedVal: string): DiffToken[] => {
  const originalTokens = tokenize(originalVal);
  const modifiedTokens = tokenize(modifiedVal);

  const n = originalTokens.length;
  const m = modifiedTokens.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (originalTokens[i - 1] === modifiedTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const result: DiffToken[] = [];
  let i = n;
  let j = m;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && originalTokens[i - 1] === modifiedTokens[j - 1]) {
      result.unshift({
        type: 'equal',
        value: originalTokens[i - 1]
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'added',
        value: modifiedTokens[j - 1]
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({
        type: 'removed',
        value: originalTokens[i - 1]
      });
      i--;
    }
  }

  return result;
};

const renderDiffLine = (
  originalVal: string | undefined,
  modifiedVal: string | undefined,
  mode: 'removed' | 'added'
) => {
  const orig = originalVal || '';
  const mod = modifiedVal || '';

  if (!orig && !mod) return ' ';

  const tokens = diffTokens(orig, mod);

  if (mode === 'removed') {
    return tokens
      .filter((t) => t.type !== 'added')
      .map((t, i) => (
        <span key={i} className={t.type === 'removed' ? 'diff-highlight' : ''}>
          {t.value}
        </span>
      ));
  } else {
    return tokens
      .filter((t) => t.type !== 'removed')
      .map((t, i) => (
        <span key={i} className={t.type === 'added' ? 'diff-highlight' : ''}>
          {t.value}
        </span>
      ));
  }
};

export const CodeCompare: React.FC = () => {
  const [originalText, setOriginalText] = useState<string>('');
  const [modifiedText, setModifiedText] = useState<string>('');

  const [alignedResults, setAlignedResults] = useState<VisualLine[]>([]);
  const [hasCompared, setHasCompared] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const leftPaneRef = React.useRef<HTMLDivElement>(null);
  const rightPaneRef = React.useRef<HTMLDivElement>(null);
  const activeScrollSourceRef = React.useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = React.useRef<number | null>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (activeScrollSourceRef.current && activeScrollSourceRef.current !== target) {
      return;
    }

    activeScrollSourceRef.current = target;
    const otherPane = target === leftPaneRef.current ? rightPaneRef.current : leftPaneRef.current;
    if (otherPane) {
      otherPane.scrollTop = target.scrollTop;
      otherPane.scrollLeft = target.scrollLeft;
    }

    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      activeScrollSourceRef.current = null;
    }, 100);
  };

  React.useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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

  const renderUnifiedDiff = () => {
    return (
      <div className="inline-diff-container">
        <div className="diff-content">
          {alignedResults.map((row, idx) => {
            const elements: React.ReactNode[] = [];

            // 1. If original exists (either equal or removed)
            if (row.original.type !== 'empty') {
              const isRemoved = row.original.type === 'removed';
              const hasMatchingAdded = row.modified.type === 'added';

              if (row.original.type === 'equal') {
                elements.push(
                  <div key={`${idx}-eq`} className="diff-line line-equal">
                    <span className="ln-inline">{row.original.lineNum}</span>
                    <span className="ln-inline">{row.modified.lineNum}</span>
                    <span className="diff-marker"> </span>
                    <code className="code-text">{row.original.value || ' '}</code>
                  </div>
                );
              } else if (isRemoved) {
                elements.push(
                  <div key={`${idx}-rem`} className="diff-line line-removed">
                    <span className="ln-inline">{row.original.lineNum}</span>
                    <span className="ln-inline"></span>
                    <span className="diff-marker">-</span>
                    <code className="code-text">
                      {hasMatchingAdded
                        ? renderDiffLine(row.original.value, row.modified.value, 'removed')
                        : row.original.value || ' '}
                    </code>
                  </div>
                );
              }
            }

            // 2. If modified exists as added
            if (row.modified.type === 'added') {
              const hasMatchingRemoved = row.original.type === 'removed';
              elements.push(
                <div key={`${idx}-add`} className="diff-line line-added">
                  <span className="ln-inline"></span>
                  <span className="ln-inline">{row.modified.lineNum}</span>
                  <span className="diff-marker">+</span>
                  <code className="code-text">
                    {hasMatchingRemoved
                      ? renderDiffLine(row.original.value, row.modified.value, 'added')
                      : row.modified.value || ' '}
                  </code>
                </div>
              );
            }

            return elements;
          })}
        </div>
      </div>
    );
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
          <div className="workspace-header" style={{ marginBottom: '16px', alignItems: 'center' }}>
            <h3 className="results-title" style={{ margin: 0 }}>비교 분석 결과</h3>
            <div className="segmented-control">
              <button
                className={viewMode === 'split' ? 'active' : ''}
                onClick={() => setViewMode('split')}
              >
                나란히 보기
              </button>
              <button
                className={viewMode === 'unified' ? 'active' : ''}
                onClick={() => setViewMode('unified')}
              >
                합쳐 보기
              </button>
            </div>
          </div>
          
          {viewMode === 'split' ? (
            <div className="side-by-side-diff-container">
              {/* Left pane: Original */}
              <div className="diff-pane">
                <div className="pane-header">Original</div>
                <div className="diff-content" ref={leftPaneRef} onScroll={handleScroll}>
                  {alignedResults.map((row, idx) => {
                    if (row.original.type === 'empty') {
                      return <div key={idx} className="diff-line line-empty">&nbsp;</div>;
                    }
                    
                    const isRemoved = row.original.type === 'removed';
                    const hasMatchingAdded = row.modified.type === 'added';
                    
                    return (
                      <div key={idx} className={`diff-line ${isRemoved ? 'line-removed' : 'line-equal'}`}>
                        <span className="ln">{row.original.lineNum}</span>
                        <span className="diff-marker">{isRemoved ? '-' : ' '}</span>
                        <code className="code-text">
                          {isRemoved && hasMatchingAdded
                            ? renderDiffLine(row.original.value, row.modified.value, 'removed')
                            : row.original.value || ' '}
                        </code>
                      </div>
                    );
                  })}
                </div>
              </div>
 
              {/* Right pane: Modified */}
              <div className="diff-pane">
                <div className="pane-header">Modified</div>
                <div className="diff-content" ref={rightPaneRef} onScroll={handleScroll}>
                  {alignedResults.map((row, idx) => {
                    if (row.modified.type === 'empty') {
                      return <div key={idx} className="diff-line line-empty">&nbsp;</div>;
                    }
                    
                    const isAdded = row.modified.type === 'added';
                    const hasMatchingRemoved = row.original.type === 'removed';
                    
                    return (
                      <div key={idx} className={`diff-line ${isAdded ? 'line-added' : 'line-equal'}`}>
                        <span className="ln">{row.modified.lineNum}</span>
                        <span className="diff-marker">{isAdded ? '+' : ' '}</span>
                        <code className="code-text">
                          {isAdded && hasMatchingRemoved
                            ? renderDiffLine(row.original.value, row.modified.value, 'added')
                            : row.modified.value || ' '}
                        </code>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            renderUnifiedDiff()
          )}
        </div>
      )}
    </div>
  );
};
