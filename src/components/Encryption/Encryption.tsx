import React, { useState } from 'react';
import './Encryption.css';

// MD5 Hash helper
function computeMD5(str: string): string {
  let k = [], i = 0;
  for (; i < 64; ) k[i] = 0 | (Math.sin(++i) * 4294967296);
  let h = [1732584193, -271733879, -1732584194, 271733878];
  
  let words: number[] = [];
  let s = unescape(encodeURIComponent(str));
  for (i = 0; i < s.length; i++) words[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
  words[s.length >> 2] |= 0x80 << ((s.length % 4) << 3);
  words[(((s.length + 8) >> 6) + 1) * 16 - 2] = s.length * 8;
  
  for (i = 0; i < words.length; i += 16) {
    let a = h[0], b = h[1], c = h[2], d = h[3];
    for (let j = 0; j < 64; j++) {
      let f = [
        () => (b & c) | (~b & d),
        () => (d & b) | (~d & c),
        () => b ^ c ^ d,
        () => c ^ (b | ~d)
      ][j >> 4]();
      let temp = d;
      d = c;
      c = b;
      b = (b + ((a + f + k[j] + (words[i + [
        j, (5 * j + 1) % 16, (3 * j + 5) % 16, (7 * j) % 16
      ][j >> 4]]) | 0) << [
        [7, 12, 17, 22], [5, 9, 14, 20], [4, 11, 16, 23], [6, 10, 15, 21]
      ][j >> 4][j % 4]) | 0) | 0;
      a = temp;
    }
    h[0] = (h[0] + a) | 0;
    h[1] = (h[1] + b) | 0;
    h[2] = (h[2] + c) | 0;
    h[3] = (h[3] + d) | 0;
  }
  
  return h.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

// AES Web Crypto Helpers
async function aesGcmEncrypt(plainText: string, keyStr: string, ivStr: string): Promise<string> {
  const enc = new TextEncoder();
  const keyHash = await crypto.subtle.digest('SHA-256', enc.encode(keyStr));
  const key = await crypto.subtle.importKey(
    'raw', 
    keyHash, 
    { name: 'AES-GCM' }, 
    false, 
    ['encrypt', 'decrypt']
  );
  
  const iv = new Uint8Array(12);
  const ivBytes = enc.encode(ivStr || 'default-iv-12');
  iv.set(ivBytes.subarray(0, 12));
  
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(plainText)
  );
  
  const cipherBytes = new Uint8Array(cipherBuffer);
  let binary = '';
  for (let i = 0; i < cipherBytes.byteLength; i++) {
    binary += String.fromCharCode(cipherBytes[i]);
  }
  return btoa(binary);
}

async function aesGcmDecrypt(cipherBase64: string, keyStr: string, ivStr: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const keyHash = await crypto.subtle.digest('SHA-256', enc.encode(keyStr));
    const key = await crypto.subtle.importKey(
      'raw', 
      keyHash, 
      { name: 'AES-GCM' }, 
      false, 
      ['encrypt', 'decrypt']
    );
    
    const iv = new Uint8Array(12);
    const ivBytes = enc.encode(ivStr || 'default-iv-12');
    iv.set(ivBytes.subarray(0, 12));
    
    const binary = atob(cipherBase64);
    const cipherBytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      cipherBytes[i] = binary.charCodeAt(i);
    }
    
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      cipherBytes
    );
    
    return new TextDecoder().decode(plainBuffer);
  } catch {
    return '[AES Decryption Error]: Invalid Key, IV, or Cipher text';
  }
}

export const Encryption: React.FC = () => {
  const [subTab, setSubTab] = useState<'cipher' | 'hash'>('cipher');
  const [cipherMode, setCipherMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [algorithm, setAlgorithm] = useState<string>('aes-256');
  const [secretKey, setSecretKey] = useState<string>('my-secret-key-123');
  const [ivVector, setIvVector] = useState<string>('my-iv-vector');
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');

  const [hashResult, setHashResult] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: '',
  });

  const handleCipherAction = async () => {
    if (!inputText) {
      setOutputText('');
      return;
    }

    if (cipherMode === 'encrypt') {
      const encrypted = await aesGcmEncrypt(inputText, secretKey, ivVector);
      setOutputText(encrypted);
    } else {
      const decrypted = await aesGcmDecrypt(inputText, secretKey, ivVector);
      setOutputText(decrypted);
    }
  };

  const handleHashAction = async () => {
    if (!inputText) {
      setHashResult({ md5: '', sha1: '', sha256: '', sha512: '' });
      return;
    }

    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(inputText);

    const md5Val = computeMD5(inputText);

    const getHashString = async (algo: string): Promise<string> => {
      const hashBuffer = await crypto.subtle.digest(algo, data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    try {
      const sha1Val = await getHashString('SHA-1');
      const sha256Val = await getHashString('SHA-256');
      const sha512Val = await getHashString('SHA-512');

      setHashResult({
        md5: md5Val,
        sha1: sha1Val,
        sha256: sha256Val,
        sha512: sha512Val,
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setHashResult({ md5: '', sha1: '', sha256: '', sha512: '' });
  };

  return (
    <div className="tool-workspace">
      <div className="workspace-header">
        <div className="workspace-title-area">
          <h2>암호화 및 해시 (Cryptography & Hash)</h2>
          <p className="workspace-desc">대칭키 암호화(AES-GCM) 및 SHA 계열의 단방향 암호 해시 연산을 실시간으로 처리합니다.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sub-navigation">
        <button 
          className={`sub-nav-btn ${subTab === 'cipher' ? 'active' : ''}`}
          onClick={() => setSubTab('cipher')}
        >
          대칭키 암호화 (Cipher)
        </button>
        <button 
          className={`sub-nav-btn ${subTab === 'hash' ? 'active' : ''}`}
          onClick={() => setSubTab('hash')}
        >
          해시 생성기 (Hash Generator)
        </button>
      </div>

      {subTab === 'cipher' ? (
        <div className="cipher-layout">
          {/* Options */}
          <div className="tool-toolbar border-bottom-none">
            <div className="toolbar-group">
              <label>알고리즘:</label>
              <select 
                className="select-input"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
              >
                <option value="aes-256">AES-256 (GCM Mode)</option>
              </select>
            </div>

            <div className="toolbar-group">
              <label>동작 종류:</label>
              <div className="segmented-control">
                <button 
                  className={cipherMode === 'encrypt' ? 'active' : ''} 
                  onClick={() => setCipherMode('encrypt')}
                >
                  Encrypt (암호화)
                </button>
                <button 
                  className={cipherMode === 'decrypt' ? 'active' : ''} 
                  onClick={() => setCipherMode('decrypt')}
                >
                  Decrypt (복호화)
                </button>
              </div>
            </div>
          </div>

          {/* Keys */}
          <div className="secret-key-bar">
            <div className="key-input-wrapper">
              <label htmlFor="secretKey">비밀키 (Secret Key):</label>
              <input 
                type="password" 
                id="secretKey" 
                className="text-input" 
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="암호화에 사용할 비밀 키를 입력하세요" 
              />
            </div>
            <div className="key-input-wrapper">
              <label htmlFor="ivVector">초기화 벡터 (IV):</label>
              <input 
                type="text" 
                id="ivVector" 
                className="text-input" 
                value={ivVector}
                onChange={(e) => setIvVector(e.target.value)}
                placeholder="IV (아무 텍스트나 입력하세요)" 
              />
            </div>
          </div>

          {/* Texts */}
          <div className="dual-editors-layout">
            <div className="editor-card">
              <div className="panel-card-header">
                <span>{cipherMode === 'encrypt' ? '평문 (Plain Text)' : '암호문 (Cipher Text)'}</span>
                <button className="btn-text-action" onClick={handleClear}>지우기</button>
              </div>
              <div className="code-editor-wrapper">
                <textarea 
                  className="code-textarea plain-textarea" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={cipherMode === 'encrypt' ? '암호화할 문자열을 입력하세요...' : '복호화할 Base64 문자열을 입력하세요...'}
                />
              </div>
            </div>

            <div className="editor-card">
              <div className="panel-card-header">
                <span>결과 출력 (Base64 / Text)</span>
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
            <button className="btn-primary-gradient" onClick={handleCipherAction}>
              {cipherMode === 'encrypt' ? '암호화 실행' : '복호화 실행'}
            </button>
          </div>
        </div>
      ) : (
        <div className="hash-layout">
          <div className="dual-editors-layout">
            {/* Input */}
            <div className="editor-card">
              <div className="panel-card-header">
                <span>대상 텍스트 (Plain Text)</span>
                <button className="btn-text-action" onClick={handleClear}>지우기</button>
              </div>
              <div className="code-editor-wrapper">
                <textarea 
                  className="code-textarea plain-textarea" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="해시를 생성할 평문 텍스트를 입력하세요..."
                />
              </div>
            </div>

            {/* Results */}
            <div className="hash-results-panel">
              <h3 className="options-title">알고리즘별 해시 결과</h3>
              
              <div className="hash-result-row">
                <span className="hash-algo-label">MD5</span>
                <div className="hash-output-box">
                  <input type="text" readOnly value={hashResult.md5} placeholder="결과 대기 중..." />
                </div>
              </div>

              <div className="hash-result-row">
                <span className="hash-algo-label">SHA-1</span>
                <div className="hash-output-box">
                  <input type="text" readOnly value={hashResult.sha1} placeholder="결과 대기 중..." />
                </div>
              </div>

              <div className="hash-result-row">
                <span className="hash-algo-label">SHA-256</span>
                <div className="hash-output-box">
                  <input type="text" readOnly value={hashResult.sha256} placeholder="결과 대기 중..." />
                </div>
              </div>

              <div className="hash-result-row">
                <span className="hash-algo-label">SHA-512</span>
                <div className="hash-output-box">
                  <input type="text" readOnly value={hashResult.sha512} placeholder="결과 대기 중..." />
                </div>
              </div>
            </div>
          </div>

          <div className="workspace-footer-actions justify-right">
            <button className="btn-primary-gradient" onClick={handleHashAction}>해시 값 생성</button>
          </div>
        </div>
      )}
    </div>
  );
};
