
import React, { useState, useEffect } from 'react';
import { Github, Check, X, Loader2, AlertCircle, FileText, Settings } from 'lucide-react';
import { GeneratedReport, GitHubConfig } from '../types';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: GeneratedReport[];
  onUpload: (config: GitHubConfig) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({ isOpen, onClose, reports, onUpload }) => {
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('Svenno76');
  const [repo, setRepo] = useState('bioplastic-website');
  const [path, setPath] = useState('content/news');
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    // Try to load token from localStorage
    const savedToken = localStorage.getItem('github_token');
    if (savedToken) setToken(savedToken);
  }, []);

  const handleApprove = () => {
    if (!token) {
      alert("Please enter a GitHub Personal Access Token to continue.");
      return;
    }
    // Save token for future use
    localStorage.setItem('github_token', token);
    
    onUpload({ token, owner, repo, path });
  };

  if (!isOpen) return null;

  const isUploading = reports.some(r => r.status === 'uploading');
  const allSuccess = reports.every(r => r.status === 'success');
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-2">
            <Github className="w-6 h-6 text-gray-800" />
            <h2 className="text-lg font-bold text-gray-900">Approve & Publish</h2>
          </div>
          {!isUploading && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {allSuccess ? (
             <div className="text-center py-8">
               <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Check className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Published Successfully!</h3>
               <p className="text-gray-600">
                 All stories have been pushed to <strong>{owner}/{repo}/{path}</strong>.
               </p>
             </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Reports have been downloaded. Do you want to approve these stories and push them to your GitHub repository?
              </p>

              {/* GitHub Configuration Section */}
              <div className="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                   <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                     GitHub Configuration
                     {!showConfig && token && <Check className="w-3 h-3 ml-2 text-green-500"/>}
                   </h3>
                   <button 
                     onClick={() => setShowConfig(!showConfig)}
                     className="flex items-center text-xs text-blue-600 hover:underline"
                   >
                     <Settings className="w-3 h-3 mr-1" />
                     {showConfig ? 'Hide Settings' : 'Edit Settings'}
                   </button>
                </div>
                
                <div className={`space-y-3 ${showConfig || !token ? 'block' : 'hidden'}`}>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Personal Access Token (Required)</label>
                    <input 
                      type="password" 
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">Token needs 'repo' scope permissions.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Owner</label>
                      <input type="text" value={owner} onChange={(e) => setOwner(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Repo</label>
                      <input type="text" value={repo} onChange={(e) => setRepo(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300" />
                    </div>
                      <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Path</label>
                      <input type="text" value={path} onChange={(e) => setPath(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg border border-gray-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Report List */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Pending Stories ({reports.length})</h3>
                {reports.map((report, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className={`p-2 rounded-lg ${
                        report.status === 'success' ? 'bg-green-100 text-green-600' :
                        report.status === 'error' ? 'bg-red-100 text-red-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{report.title}</p>
                        <p className="text-xs text-gray-400 truncate">{report.fileName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center ml-4">
                      {report.status === 'uploading' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                      {report.status === 'success' && <Check className="w-4 h-4 text-green-600" />}
                      {report.status === 'error' && (
                        <div className="flex items-center text-red-500" title={report.errorMessage}>
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                      {report.status === 'pending' && <span className="text-xs text-gray-400">Ready</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
          {allSuccess ? (
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors"
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
              >
                NO (Cancel)
              </button>
              <button
                onClick={handleApprove}
                disabled={isUploading || !token}
                className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    <span>YES (Approve & Push)</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
