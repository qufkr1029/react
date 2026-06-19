import React, { useState } from 'react';
import './EncoderDecoder.css';

export const EncoderDecoder: React.FC = () => {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [format, setFormat] = useState<string>('base64');
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');

  const toHex = (str: string): string => {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join(' ');
  };

  const fromHex = (hex: string): string => {
    try {
      const cleaned = hex.replace(/\s+/g, '');
      const bytes = cleaned.match(/.{1,2}/g) || [];
      const byteArray = new Uint8Array(bytes.map(byte => parseInt(byte, 16)));
      
      const decoder = new TextDecoder();
      return decoder.decode(byteArray);
    } catch {
      return '[Hex Decoding Error]: Invalid Hex string structure';
    }
  };

  const rot13 = (str: string): string => {
    return str.replace(/[a-zA-Z]/g, (char) => {
      const code = char.charCodeAt(0);
      const isUpperCase = code >= 65 && code <= 90;
      const base = isUpperCase ? 65 : 97;
      return String.fromCharCode(((code - base + 13) % 26) + base);
    });
  };

  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const unescapeHtml = (str: string): string => {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");
  };

  const convertText = (): string => {
    const raw = inputText;
    if (!raw) return '';

    if (mode === 'encode') {
      switch (format) {
        case 'base64':
          try {
            return btoa(encodeURIComponent(raw).replace(/%([0-9A-F]{2})/g, (_, p1) => {
              return String.fromCharCode(parseInt(p1, 16));
            }));
          } catch (err: any) {
            return `[Base64 Encoding Error]: ${err.message}`;
          }
        case 'url':
          return encodeURIComponent(raw);
        case 'hex':
          return toHex(raw);
        case 'html':
          return escapeHtml(raw);
        case 'rot13':
          return rot13(raw);
        default:
          return raw;
      }
    } else {
      switch (format) {
        case 'base64':
          try {
            return decodeURIComponent(atob(raw).split('').map(c => {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
          } catch (err: any) {
            return `[Base64 Decoding Error]: ${err.message}`;
          }
        case 'url':
          try {
            return decodeURIComponent(raw);
          } catch (err: any) {
            return `[URL Decoding Error]: ${err.message}`;
          }
        case 'hex':
          return fromHex(raw);
        case 'html':
          return unescapeHtml(raw);
        case 'rot13':
          return rot13(raw);
        default:
          return raw;
      }
    }
  };

  const handleConvert = () => {
    setOutputText(convertText());
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  return (
    <div className="tool-workspace">
      <div className="workspace-header">
        <div className="workspace-title-area">
          <h2>인코딩 / 디코딩 (Encoder & Decoder)</h2>
          <p className="workspace-desc">텍스트 데이터를 Base64, URL, Hex 등 다양한 표준 인코딩 포맷으로 상호 변환합니다.</p>
        </div>
      </div>

      <div className="tool-toolbar">
        <div className="toolbar-group">
          <label>동작 모드:</label>
          <div className="segmented-control">
            <button 
              className={mode === 'encode' ? 'active' : ''} 
              onClick={() => setMode('encode')}
            >
              Encode (부호화)
            </button>
            <button 
              className={mode === 'decode' ? 'active' : ''} 
              onClick={() => setMode('decode')}
            >
              Decode (복호화)
            </button>
          </div>
        </div>

        <div className="toolbar-group">
          <label>인코딩 스키마:</label>
          <select 
            className="select-input" 
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="base64">Base64</option>
            <option value="url">URL Encoding</option>
            <option value="hex">Hexadecimal (16진수)</option>
            <option value="html">HTML Entities</option>
            <option value="rot13">ROT13</option>
          </select>
        </div>
      </div>

      <div className="dual-editors-layout">
        <div className="editor-card">
          <div className="panel-card-header">
            <span>{mode === 'encode' ? '원본 텍스트 (Plain Text)' : '인코딩된 텍스트 (Encoded)'}</span>
            <button className="btn-text-action" onClick={handleClear}>지우기</button>
          </div>
          <div className="code-editor-wrapper">
            <textarea 
              className="code-textarea plain-textarea" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="여기에 처리할 텍스트를 입력하세요..."
            />
          </div>
        </div>

        <div className="editor-card">
          <div className="panel-card-header">
            <span>변환 결과 (Result)</span>
          </div>
          <div className="code-editor-wrapper">
            <textarea 
              className="code-textarea plain-textarea readonly-editor" 
              readOnly
              value={outputText}
              placeholder="결과가 여기에 출력됩니다..."
            />
          </div>
        </div>
      </div>

      <div className="workspace-footer-actions justify-right">
        <button className="btn-primary-gradient" onClick={handleConvert}>변환 실행</button>
      </div>
    </div>
  );
};
