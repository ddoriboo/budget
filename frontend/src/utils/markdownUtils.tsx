// 간단한 마크다운 렌더링 유틸리티

import React from 'react';

export const renderMarkdown = (text: string): React.ReactNode => {
  if (!text) return text;

  // 줄바꿈을 <br>로 변환
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // **bold** 처리
    let processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // *italic* 처리  
    processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // `code` 처리
    processedLine = processedLine.replace(/`(.*?)`/g, '<code className="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');
    
    // ### 헤더 처리
    if (processedLine.startsWith('### ')) {
      processedLine = processedLine.replace(/^### (.*)/, '<h3 className="text-lg font-semibold mb-2">$1</h3>');
    } else if (processedLine.startsWith('## ')) {
      processedLine = processedLine.replace(/^## (.*)/, '<h2 className="text-xl font-bold mb-2">$1</h2>');
    }
    
    // - 리스트 아이템 처리
    if (processedLine.trim().startsWith('- ')) {
      processedLine = processedLine.replace(/^- (.*)/, '<li className="ml-4">• $1</li>');
    }
    
    // └ 서브 아이템 처리 (트리 구조)
    if (processedLine.includes('└')) {
      processedLine = processedLine.replace(/└/g, '<span className="ml-2 text-gray-600">└</span>');
    }
    
    return (
      <span key={lineIndex}>
        <span dangerouslySetInnerHTML={{ __html: processedLine }} />
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
};

// 더 안전한 방법으로 간단한 마크다운 렌더링
export const renderSimpleMarkdown = (text: string): React.ReactNode => {
  if (!text) return text;

  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    let content: React.ReactNode = line;
    
    // **bold** 처리
    if (line.includes('**')) {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      content = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIndex}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    }
    
    // ### 헤더 처리
    if (line.startsWith('### ')) {
      return <h3 key={lineIndex} className="text-lg font-semibold mb-1">{line.slice(4)}</h3>;
    } else if (line.startsWith('## ')) {
      return <h2 key={lineIndex} className="text-xl font-bold mb-2">{line.slice(3)}</h2>;
    }
    
    // - 리스트 처리
    if (line.trim().startsWith('- ')) {
      return <div key={lineIndex} className="ml-2">• {line.slice(2)}</div>;
    }
    
    // └ 트리 구조 처리
    if (line.includes('└')) {
      return <div key={lineIndex} className="ml-2 text-gray-600">{content}</div>;
    }
    
    return (
      <span key={lineIndex}>
        {content}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    );
  });
};