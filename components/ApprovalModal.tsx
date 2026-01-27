
import React, { useState, useEffect } from 'react';
import { Github, Check, X, Loader2, AlertCircle, FileText, Settings, Trash2, Save, Send, Info } from 'lucide-react';
import { GeneratedReport, GitHubConfig } from '../types';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: GeneratedReport[];
  onUpload: (config: GitHubConfig, editedReports: GeneratedReport[]) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ isOpen, onClose, reports, onUpload }) => {
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('Svenno76');
  const [repo, setRepo] = useState('bioplastic-website');
  const [path, setPath] = useState('content/news');
  const [showConfig, setShowConfig] = useState(false);
  
  // Local state for editing the reports
  const [editableReports, setEditableReports] = useState<GeneratedReport[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    // Try to load token from localStorage
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) setToken(savedToken);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setEditableReports([...reports]);
      setSelectedIndex(0);
    }
  }, [isOpen, reports]);

  const handleContentChange = (newContent: string) => {
    const updated = [...editableReports];
    updated[selectedIndex] = { ...updated[selectedIndex], content: newContent };
    setEditableReports(updated);
  };

  const handleFileNameChange = (newName: string) => {
    const updated = [...editableReports];
    updated[selectedIndex] = { ...updated[selectedIndex], fileName: newName };
    setEditableReports(updated);
  };

  const handleDiscard = (index: number) => {
    const updated = editableReports.filter((_, i) => i !== index);
    setEditableReports(updated);
    if (updated.length === 0) {
      onClose();
    } else {
      setSelectedIndex(Math.max(0, index - 1));
    }
  };

  const handleApprove = () => {
    if (!token) {
      setShowConfig(true);
      alert("Please enter a GitHub Personal Access Token to continue.");
      return;
    }
    // Save token for future use
    localStorage.setItem('github_token', token);
    onUpload({ token, owner, repo, path }, editableReports);
  };

  if (!isOpen) return null;

  const currentReport = editableReports[selectedIndex];
  const isUploading = editableReports.some(r => r.status === 'uploading');
  const allSuccess = editableReports.length > 0 && editableReports.every(r => r.status === 'success');
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-900 p-2 rounded-xl text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-none">Review & Publish</h2>
              <p className="text-xs text-gray-400 mt-1 font-medium">Step 2: Polish your story before it goes live</p>
            </div>
          </div>
          {!isUploading && (
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar - Report List */}
          <div className="w-72 border-r border-gray-100 bg-gray-50/50 overflow-y-auto p-4 space-y-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">Queue ({editableReports.length})</h3>
            {editableReports.map((report, idx) => (
              <div 
                key={idx} 
                onClick={() => !isUploading && setSelectedIndex(idx)}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedIndex === idx 
                    ? 'bg-white border-emerald-200 shadow-sm ring-1 ring-emerald-100' 
                    : 'bg-transparent border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${
                    report.status === 'success' ? 'bg-green-100 text-green-600' :
                    report.status === 'error' ? 'bg-red-100 text-red-600' :
                    selectedIndex === idx ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {report.status === 'uploading' ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold truncate ${selectedIndex === idx ? 'text-emerald-900' : 'text-gray-700'}`}>
                      {report.title}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{report.fileName}</p>
                  </div>
                  {!isUploading && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDiscard(idx); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-gray-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Main Editor */}
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {allSuccess ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Successfully Published!</h3>
                <p className="text-gray-500 max-w-sm">
                  Your bioplastic intelligence report has been pushed to the GitHub repository.
                </p>
                <button 
                  onClick={onClose}
                  className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
                >
                  Done
                </button>
              </div>
            ) : currentReport ? (
              <div className="flex-1 flex flex-col p-6 overflow-hidden">
                <div className="mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filename</span>
                      <input 
                        type="text" 
                        value={currentReport.fileName}
                        onChange={(e) => handleFileNameChange(e.target.value)}
                        disabled={isUploading}
                        className="flex-1 text-xs font-mono bg-gray-50 border border-gray-100 rounded-md px-3 py-1 text-gray-600 outline-none focus:bg-white focus:border-emerald-300 transition-all"
                      />
                    </div>
                  </div>
                  <h4 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                    <span>{currentReport.title}</span>
                  </h4>
                </div>

                <div className="flex-1 relative border border-gray-100 rounded-2xl overflow-hidden shadow-inner bg-slate-50">
                  <textarea 
                    value={currentReport.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    disabled={isUploading}
                    className="w-full h-full p-8 font-mono text-sm text-slate-700 bg-transparent resize-none outline-none focus:ring-0 leading-relaxed"
                    placeholder="Markdown content goes here..."
                  />
                  {currentReport.status === 'error' && (
                    <div className="absolute inset-x-4 bottom-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex flex-col shadow-lg animate-in slide-in-from-bottom">
                      <div className="flex items-start mb-2">
                        <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm">Upload Failed</p>
                          <p className="text-xs opacity-90">{currentReport.errorMessage || 'Unknown error'}</p>
                        </div>
                      </div>
                      {currentReport.errorMessage?.includes('Resource not accessible') && (
                        <div className="mt-2 p-2 bg-red-100/50 rounded-lg text-[11px] leading-relaxed">
                          <span className="font-bold">Fix:</span> Ensure your Token has <strong>'Contents' Read & Write</strong> permissions. 
                          If using a Fine-grained token, make sure it's granted access to the specific repository <strong>{owner}/{repo}</strong>.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p>No story selected</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer / GitHub Config */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/80">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Config Trigger */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowConfig(!showConfig)}
                className={`flex items-center space-x-2 text-xs font-bold transition-all ${showConfig ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Settings className="w-4 h-4" />
                <span>GITHUB SETTINGS</span>
              </button>
              
              {!showConfig && token && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-[10px] font-mono text-gray-500">
                  <Github className="w-3 h-3" />
                  <span>{owner}/{repo}/{path}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 w-full md:w-auto">
              {!allSuccess && (
                <>
                  <button
                    onClick={onClose}
                    disabled={isUploading}
                    className="flex-1 md:flex-none px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 disabled:opacity-30 transition-all uppercase tracking-widest"
                  >
                    Discard All
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isUploading || editableReports.length === 0}
                    className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200/50 transition-all"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>PUBLISHING...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>APPROVE & PUBLISH</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Collapsible Config Form */}
          {showConfig && (
            <div className="mt-6 p-6 bg-white rounded-2xl border border-emerald-100 shadow-sm animate-in slide-in-from-bottom-4">
              <div className="mb-4 flex items-center p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-100">
                <Info className="w-4 h-4 mr-3 flex-shrink-0" />
                <p className="text-[11px] leading-snug">
                  <strong>Token Scopes Required:</strong> For <span className="font-bold">Fine-grained tokens</span>, grant <strong>"Contents" Read & Write</strong> access. For <span className="font-bold">Classic tokens</span>, select the <strong>"repo"</strong> scope.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Personal Access Token</label>
                    <input 
                      type="password" 
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="w-full text-xs px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Path</label>
                    <input type="text" value={path} onChange={(e) => setPath(e.target.value)} className="w-full text-xs px-4 py-2.5 rounded-xl border border-gray-200" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Owner (Username)</label>
                    <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full text-xs px-4 py-2.5 rounded-xl border border-gray-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Repository Name</label>
                    <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} className="w-full text-xs px-4 py-2.5 rounded-xl border border-gray-200" />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button 
                  onClick={() => setShowConfig(false)}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  SAVE CONFIG
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
