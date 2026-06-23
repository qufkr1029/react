import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { 
  CopyIcon, 
  RefreshIcon, 
  ExpandIcon, 
  ShrinkIcon, 
  FullscreenIcon, 
  ExitFullscreenIcon,
  TrashIcon 
} from '../Icons/SvgIcons';
import './MarkdownEditor.css';

export const MarkdownEditor: React.FC = () => {
  const [markdownText, setMarkdownText] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [copyLabel, setCopyLabel] = useState<string>('HTML 복사');
  
  // View states
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const previewCardRef = useRef<HTMLDivElement>(null);

  // Load configuration for marked
  useEffect(() => {
    marked.setOptions({
      gfm: true,
      breaks: true
    });
  }, []);

  // Sync markdown to html parsing
  useEffect(() => {
    if (!markdownText.trim()) {
      setHtmlContent('<p class="preview-placeholder">마크다운을 입력하면 여기에 실시간으로 렌더링 결과가 표시됩니다.</p>');
      return;
    }
    
    try {
      const parsed = marked.parse(markdownText);
      if (typeof parsed === 'string') {
        setHtmlContent(parsed);
      } else {
        parsed.then((res) => setHtmlContent(res));
      }
    } catch (error) {
      setHtmlContent(`<p class="preview-error">마크다운 파싱 중 오류가 발생했습니다: ${(error as Error).message}</p>`);
    }
  }, [markdownText]);

  // Synchronize HTML5 Fullscreen API state to React state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleCopyHtml = () => {
    if (!htmlContent.trim()) return;
    navigator.clipboard.writeText(htmlContent).then(() => {
      setCopyLabel('복사됨!');
      setTimeout(() => setCopyLabel('HTML 복사'), 1500);
    });
  };

  const handleReset = () => {
    setMarkdownText('');
  };

  const handleToggleFullscreen = () => {
    if (!previewCardRef.current) return;
    if (!document.fullscreenElement) {
      previewCardRef.current.requestFullscreen().catch((err) => {
        console.error(`전체화면 모드 전환 실패: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleLoadExample = () => {
    const exampleMarkdown = `# 마크다운 실시간 번역 예제 🚀

이 도구는 **마크다운(Markdown)** 문법을 실시간으로 번역하여 우측 영역에 렌더링합니다.

## 주요 기능
1. **실시간 번역 및 렌더링**: 타이핑과 동시에 결과 확인
2. **다크 모드 지원**: 테마에 맞춘 수려한 디자인 제공
3. **HTML 복사**: 번역된 HTML 소스 코드 복사 기능

---

### 다양한 마크다운 요소 테스트

#### 1. 텍스트 강조 및 인라인 스타일
- **굵게 표시 (Bold)**
- *기울임 표시 (Italic)*
- ~~취소선 (Strikethrough)~~
- \`인라인 코드 (Inline Code)\`

#### 2. 링크 및 이미지
- [Google 바로가기](https://google.com)

#### 3. 코드 블록
\`\`\`javascript
// 자바스크립트 예제 코드
function greet(name) {
  console.log(\`안녕하세요, \${name}님!\`);
}
greet(\'개발자\');
\`\`\`

#### 4. 인용구 (Blockquote)
> "코딩은 생각하는 방식을 배우는 것입니다."
> — *스티브 잡스*

#### 5. 테이블 (Table)
| 도구 이름 | 용도 | 상태 |
| :--- | :--- | :---: |
| Code Compare | 소스 코드 차이 분석 | 사용 가능 |
| Markdown Live | 마크다운 실시간 번역 | **NEW** |
| Code Formatter | 코드 스타일 정리 | 사용 가능 |
`;
    setMarkdownText(exampleMarkdown);
  };

  return (
    <div className="tool-workspace">
      <div className="workspace-header">
        <div className="workspace-title-area">
          <h2>마크다운 실시간 번역 (Markdown Live)</h2>
          <p className="workspace-desc">왼쪽 창에 마크다운 양식으로 텍스트를 작성하면, 오른쪽 창에 HTML 프리뷰로 실시간 변환하여 렌더링합니다.</p>
        </div>
        <div className="workspace-actions">
          <button className="btn-secondary" onClick={handleLoadExample}>
            <RefreshIcon size={14} /> 예제 로드
          </button>
        </div>
      </div>

      {/* Editor & Preview Panels */}
      <div className={`markdown-grid ${isExpanded ? 'is-expanded' : ''}`}>
        {/* Left Panel: Markdown Editor */}
        <div className="markdown-panel-card markdown-editor-card">
          <div className="panel-card-header">
            <span>마크다운 작성 (Markdown)</span>
            <div className="panel-header-actions">
              <span className="char-counter">{markdownText.length} 자</span>
              <span className="divider">|</span>
              <button className="btn-text-action action-clear" onClick={handleReset}>
                <TrashIcon size={12} /> 지우기
              </button>
            </div>
          </div>
          <div className="markdown-editor-wrapper">
            <textarea
              className="markdown-textarea"
              value={markdownText}
              onChange={(e) => setMarkdownText(e.target.value)}
              placeholder="여기에 마크다운 문법으로 작성하세요... (예: # 제목, **강조**)"
            />
          </div>
        </div>

        {/* Right Panel: HTML Rendered Preview */}
        <div 
          className={`markdown-panel-card markdown-preview-card ${isFullscreen ? 'in-fullscreen' : ''}`}
          ref={previewCardRef}
        >
          <div className="panel-card-header">
            <span>실시간 번역 결과 (Preview)</span>
            <div className="panel-header-actions">
              <button className="btn-text-action action-copy" onClick={handleCopyHtml} disabled={!markdownText.trim()}>
                <CopyIcon size={12} /> {copyLabel}
              </button>
              <span className="divider">|</span>
              <button 
                className="btn-text-action action-expand" 
                onClick={() => setIsExpanded(!isExpanded)} 
                title={isExpanded ? "에디터 보이기" : "크게 보기"}
              >
                {isExpanded ? <ShrinkIcon size={14} /> : <ExpandIcon size={14} />}
              </button>
              <span className="divider">|</span>
              <button 
                className="btn-text-action action-fullscreen" 
                onClick={handleToggleFullscreen} 
                title="전체화면"
              >
                {isFullscreen ? <ExitFullscreenIcon size={14} /> : <FullscreenIcon size={14} />}
              </button>
            </div>
          </div>
          <div className="markdown-preview-wrapper">
            <div 
              className="markdown-preview-body"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>
      </div>

      <div className="workspace-footer-actions justify-right">
        <button className="btn-secondary" onClick={handleReset}>
          <TrashIcon size={14} /> 전체 지우기
        </button>
      </div>
    </div>
  );
};
