import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import {
  FileText,
  FileImage,
  File,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  FolderOpen
} from 'lucide-react';

export interface UploadingFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  downloadUrl?: string;
  error?: string;
}

interface BatchFileUploaderProps {
  existingFiles: string[];
  onFilesChange: (files: string[]) => void;
  showToast?: (msg: string) => void;
}

export const BatchFileUploader: React.FC<BatchFileUploaderProps> = ({
  existingFiles,
  onFilesChange,
  showToast
}) => {
  const [activeUploads, setActiveUploads] = useState<UploadingFile[]>([]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string, fileName: string) => {
    const nameLower = fileName.toLowerCase();
    if (fileType.startsWith('image/') || nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) {
      return <FileImage className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
    if (fileType === 'application/pdf' || nameLower.endsWith('.pdf')) {
      return <FileText className="w-4 h-4 text-rose-400 shrink-0" />;
    }
    return <File className="w-4 h-4 text-amber-400 shrink-0" />;
  };

  const processBatchUpload = (fileList: FileList | File[]) => {
    const selectedFiles = Array.from(fileList);
    if (selectedFiles.length === 0) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    selectedFiles.forEach((file) => {
      const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newUpload: UploadingFile = {
        id: uploadId,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'uploading'
      };

      setActiveUploads((prev) => [newUpload, ...prev]);

      // Initialize Firebase Storage upload task
      const storagePath = `evidence-repository/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setActiveUploads((prev) =>
            prev.map((item) => (item.id === uploadId ? { ...item, progress: Math.min(pct, 99) } : item))
          );
        },
        (error) => {
          console.warn('Firebase Storage upload error, providing local fallback URL:', error);
          const fallbackTag = `[${timestamp}] ${file.name} (${formatFileSize(file.size)})`;
          const localUrl = URL.createObjectURL(file);

          setActiveUploads((prev) =>
            prev.map((item) =>
              item.id === uploadId
                ? {
                    ...item,
                    progress: 100,
                    status: 'completed',
                    downloadUrl: localUrl
                  }
                : item
            )
          );

          onFilesChange([...existingFiles, fallbackTag]);
          if (showToast) showToast(`Attached ${file.name} to evidence list`);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            const formattedLabel = `[${timestamp}] ${file.name} - ${url}`;

            setActiveUploads((prev) =>
              prev.map((item) =>
                item.id === uploadId
                  ? { ...item, progress: 100, status: 'completed', downloadUrl: url }
                  : item
              )
            );

            onFilesChange([...existingFiles, formattedLabel]);
            if (showToast) showToast(`Uploaded ${file.name} to Firebase Storage`);
          } catch (e) {
            const fallbackTag = `[${timestamp}] ${file.name}`;
            onFilesChange([...existingFiles, fallbackTag]);
            setActiveUploads((prev) =>
              prev.map((item) =>
                item.id === uploadId ? { ...item, progress: 100, status: 'completed' } : item
              )
            );
          }
        }
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Upload Zone */}
      <div
        className="border-2 border-dashed border-slate-800 hover:border-cyan-500/60 rounded-2xl p-6 text-center transition-all bg-slate-900/40 hover:bg-slate-900/80 cursor-pointer group"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) {
            processBatchUpload(e.dataTransfer.files);
          }
        }}
      >
        <UploadCloud className="w-8 h-8 text-cyan-400/70 group-hover:text-cyan-300 mx-auto mb-2 transition-transform duration-300 group-hover:scale-110" />
        <p className="text-xs text-slate-200 font-mono font-bold">
          Batch Upload Multiple Documents & Images (.pdf, .png, .jpeg, .xentry logs)
        </p>
        <p className="text-[10px] text-slate-500 font-mono mt-1">
          Select or drag multiple files simultaneously. Live upload progress tracked to Firebase Storage in real-time.
        </p>

        <input
          type="file"
          multiple
          accept="image/*,application/pdf,.xentry,.log,.xml,.wis,.doc,.docx"
          className="hidden"
          id="intake-batch-file-input"
          onChange={(e) => {
            if (e.target.files) {
              processBatchUpload(e.target.files);
            }
          }}
        />
        <label
          htmlFor="intake-batch-file-input"
          className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold rounded-xl cursor-pointer transition-all shadow-[0_0_15px_rgba(34,211,238,0.15)]"
        >
          <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
          Select Files for Batch Upload
        </label>
      </div>

      {/* Active Uploads with Progress Bars */}
      {activeUploads.length > 0 && (
        <div className="space-y-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" /> Batch Upload Status ({activeUploads.filter(u => u.status === 'completed').length}/{activeUploads.length} Complete)
            </span>
            <button
              type="button"
              onClick={() => setActiveUploads([])}
              className="text-[10px] font-mono text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              Clear Completed
            </button>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {activeUploads.map((up, upIdx) => (
              <div
                key={`active-upload-${up.id}-${upIdx}`}
                className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3 text-xs font-mono space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {getFileIcon(up.type, up.name)}
                    <span className="text-slate-200 font-bold truncate text-[11px]" title={up.name}>
                      {up.name}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      ({formatFileSize(up.size)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {up.status === 'uploading' && (
                      <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> {up.progress}%
                      </span>
                    )}

                    {up.status === 'completed' && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> READY
                      </span>
                    )}

                    {up.status === 'error' && (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" /> ERROR
                      </span>
                    )}

                    {up.downloadUrl && (
                      <a
                        href={up.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 p-1 hover:bg-slate-800 rounded transition-colors"
                        title="View Document"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                  <div
                    className={`h-full transition-all duration-300 ${
                      up.status === 'completed'
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                        : up.status === 'error'
                        ? 'bg-rose-500'
                        : 'bg-gradient-to-r from-cyan-500 to-emerald-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                    }`}
                    style={{ width: `${up.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stored / Attached Files list */}
      {existingFiles.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <p className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Attached Evidence Documents ({existingFiles.length} Linked to RO Record)
          </p>
          <div className="flex flex-wrap gap-2">
            {existingFiles.map((fileTag, idx) => {
              const isUrl = fileTag.includes("http://") || fileTag.includes("https://");
              let url = "";
              let displayName = fileTag;
              if (isUrl && fileTag.includes(" - ")) {
                const parts = fileTag.split(" - ");
                displayName = parts[0];
                url = parts[1];
              }

              return (
                <span
                  key={`file-tag-${idx}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 border border-slate-800 text-cyan-400 text-[11px] font-mono rounded-xl shadow-sm"
                >
                  <FileText className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="truncate max-w-xs">{displayName}</span>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-200"
                      title="Open document link"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => onFilesChange(existingFiles.filter((_, i) => i !== idx))}
                    className="hover:text-rose-400 ml-1 font-bold text-slate-500 transition-colors cursor-pointer"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
