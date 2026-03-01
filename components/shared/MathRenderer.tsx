'use client';

import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface MathRendererProps {
  text: string;
}

const MathRenderer: React.FC<MathRendererProps> = React.memo(({ text }) => {
  if (typeof text !== "string" || !text) return <>{text}</>;

  // Decode HTML entities
  const decoded = text
    .replace(/&lbrack;/g, "[")
    .replace(/&rbrack;/g, "]")
    .replace(/&amp;/g, "&");

  // Replace [http://...] with ![](http://...)
  const processedText = decoded.replace(/\[\s*(https?:\/\/[^\]\s]+)\s*\]/g, "![]($1)");

  // Split by formula markers $$...$$ or $...$
  const parts = processedText.split(/(\$\$[\s\S]*?\$\$|\$[^$]+\$)/g);

  return (
    <>
      {parts.map((part, index) => {
        // Block formula $$...$$
        if (part.startsWith("$$") && part.endsWith("$$")) {
          try {
            return <BlockMath key={index} math={part.slice(2, -2)} />;
          } catch (e) {
            console.error("KaTeX BlockMath Error:", e);
            return (
              <span key={index} className="text-red-500 font-mono">
                {part}
              </span>
            );
          }
        }

        // Inline formula $...$
        if (part.startsWith("$") && part.endsWith("$")) {
          try {
            return <InlineMath key={index} math={part.slice(1, -1)} />;
          } catch (e) {
            console.error("KaTeX InlineMath Error:", e);
            return (
              <span key={index} className="text-red-500 font-mono">
                {part}
              </span>
            );
          }
        }

        // Handle images in text
        const imgMatches = [...part.matchAll(/!\[]\((https?:\/\/[^\)]+)\)/g)];
        if (imgMatches.length > 0) {
          return (
            <div key={index} className="flex flex-wrap justify-center gap-2 my-2">
              {imgMatches.map((m, i) => (
                <img
                  key={i}
                  src={m[1]}
                  alt={`Hình ${i + 1}`}
                  className="max-h-64 rounded-lg shadow-sm object-contain"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          );
        }

        // Regular text
        return <span key={index}>{part}</span>;
      })}
    </>
  );
});

MathRenderer.displayName = 'MathRenderer';

export default MathRenderer;
