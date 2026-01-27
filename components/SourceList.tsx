import React from 'react';
import { Link2, ShieldCheck } from 'lucide-react';
import { GroundingChunk } from '../types';

interface SourceListProps {
  chunks: GroundingChunk[];
}

export const SourceList: React.FC<SourceListProps> = ({ chunks }) => {
  // Fix: Deduplicate chunks while ensuring chunk.web and chunk.web.uri exist before rendering
  const uniqueChunks = chunks.filter((chunk, index, self) =>
    chunk.web?.uri &&
    index === self.findIndex((c) => (
      c.web?.uri === chunk.web?.uri
    ))
  );

  if (uniqueChunks.length === 0) return null;

  return (
    <div className="mt-12 bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
      <div className="flex items-center space-x-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Verified Grounding Sources</h2>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        The information above was generated using Google Search Grounding. Here are the sources used for verification:
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {uniqueChunks.map((chunk, idx) => (
          <a
            key={idx}
            href={chunk.web?.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-3 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors group"
          >
            <div className="bg-blue-100 text-blue-600 p-2 rounded-md mr-3 group-hover:bg-blue-200 transition-colors">
                <Link2 className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-700">
                {chunk.web?.title || "Web Source"}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {chunk.web?.uri}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};