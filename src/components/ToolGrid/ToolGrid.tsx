import React from 'react';
import { ToolCard } from '../ToolCard/ToolCard';
import {
  CompareIcon,
  FormatterIcon,
  MinifierIcon,
  EncodeIcon,
  EncryptIcon
} from '../Icons/SvgIcons';
import './ToolGrid.css';

interface ToolGridProps {
  onSelectTool: (id: string) => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({ onSelectTool }) => {
  const tools = [
    {
      id: 'compare',
      title: '코드 비교 (Code Compare)',
      description: '두 개의 텍스트나 소스코드를 나란히 배치하여 다른 점을 실시간으로 분석하고 하이라이팅합니다.',
      icon: <CompareIcon size={28} className="tool-icon-svg text-purple" />,
      tag: 'Diff Tool',
      color: 'purple',
      isReady: true
    },
    {
      id: 'formatter',
      title: '코드 정렬 (Code Formatter)',
      description: '지저분한 코드를 정해진 규칙(Prettier 스타일 등)에 맞춰 깔끔하게 들여쓰고 정렬합니다.',
      icon: <FormatterIcon size={28} className="tool-icon-svg text-teal" />,
      tag: 'Beautifier',
      color: 'teal',
      isReady: true
    },
    {
      id: 'minifier',
      title: '코드 압축 (Code Minifier)',
      description: '불필요한 공백과 주석을 제거하고 변수명을 축소하여 웹페이지 로딩 속도를 최적화합니다.',
      icon: <MinifierIcon size={28} className="tool-icon-svg text-blue" />,
      tag: 'Optimizer',
      color: 'blue',
      isReady: true
    },
    {
      id: 'encoder',
      title: '인코딩/디코딩 (Encoder & Decoder)',
      description: 'Base64, URL, Hex, HTML Entities 등 다양한 포맷으로 데이터를 상호 인코딩/디코딩합니다.',
      icon: <EncodeIcon size={28} className="tool-icon-svg text-orange" />,
      tag: 'Data Transform',
      color: 'orange',
      isReady: true
    },
    {
      id: 'encryption',
      title: '암호화 및 해시 (Cryptography & Hash)',
      description: 'AES, DES 등 대칭키 암호화와 SHA-256, MD5 등 해시 값 생성을 간편하게 지원합니다.',
      icon: <EncryptIcon size={28} className="tool-icon-svg text-red" />,
      tag: 'Security',
      color: 'red',
      isReady: true
    }
  ];

  return (
    <div className="dashboard-container">
      <h2 className="section-title">개발 도구 모음</h2>
      <div className="tools-grid">
        {tools.map((tool) => (
          <ToolCard
            key={tool.id}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            tag={tool.tag}
            color={tool.color}
            isReady={tool.isReady}
            onClick={() => onSelectTool(tool.id)}
          />
        ))}
      </div>
    </div>
  );
};
