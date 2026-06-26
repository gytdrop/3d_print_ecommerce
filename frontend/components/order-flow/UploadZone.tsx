'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Box,
  FileBox,
  Image as ImageIcon,
  Cpu,
} from 'lucide-react';
import { useOrderStore, type FileData, type UploadMode } from '@/store/useOrderStore';
import { siteContent } from '@/config/siteContent';

// ─── Pipeline Config ──────────────────────────────────────────────────────────

const GIFT_EXTENSIONS  = ['.jpg', '.jpeg', '.png'];
const MESH_EXTENSIONS  = ['.stl', '.obj'];
const GIFT_MAX_BYTES   = 25  * 1024 * 1024;   // 25 MB  — photos
const MESH_MAX_BYTES   = 100 * 1024 * 1024;   // 100 MB — engineering geometry

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function getExtension(name: string): string {
  return '.' + (name.split('.').pop() ?? '').toLowerCase();
}

// ─── Local Types ──────────────────────────────────────────────────────────────

type DropState   = 'idle' | 'dragging' | 'processing' | 'accepted' | 'error';

interface ProcessedFile {
  name: string;
  type: 'image' | 'mesh';
  url:  string;   // object URL for images; empty string for mesh (no preview)
  size: number;   // bytes
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function UploadZone() {
  const content = siteContent.uploadFlow;

  // Global order store
  const fileData          = useOrderStore((s) => s.fileData);
  const setFileData       = useOrderStore((s) => s.setFileData);
  const setBasePrice      = useOrderStore((s) => s.setBasePrice);
  const previewGenerated  = useOrderStore((s) => s.previewGenerated);
  const setPreviewGenerated = useOrderStore((s) => s.setPreviewGenerated);
  const uploadMode        = useOrderStore((s) => s.uploadMode);
  const setUploadMode     = useOrderStore((s) => s.setUploadMode);

  // ── Drop-zone state ──────────────────────────────────────────────────────────
  const [dropState,   setDropState]   = useState<DropState>(fileData ? 'accepted' : 'idle');
  const [errorMsg,    setErrorMsg]    = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Unified processed-file state ─────────────────────────────────────────────
  const [processedFile, setProcessedFile] = useState<ProcessedFile | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (processedFile?.url) URL.revokeObjectURL(processedFile.url);
    };
  }, [processedFile]);

  // Reset the zone whenever the user switches pipeline mode
  const switchMode = (mode: UploadMode) => {
    if (mode === uploadMode) return;
    setUploadMode(mode);
    resetFile();
  };

  // ── Validation & acceptance ──────────────────────────────────────────────────

  const acceptFile = useCallback(
    (file: File) => {
      const ext     = getExtension(file.name);
      const allowed = uploadMode === 'gift' ? GIFT_EXTENSIONS : MESH_EXTENSIONS;
      const maxSize = uploadMode === 'gift' ? GIFT_MAX_BYTES  : MESH_MAX_BYTES;
      const label   = uploadMode === 'gift' ? 'JPG, JPEG, or PNG image' : 'STL or OBJ mesh file';
      const maxLabel = uploadMode === 'gift' ? '25 MB' : '100 MB';

      if (!allowed.includes(ext)) {
        setDropState('error');
        setErrorMsg(
          `"${ext.toUpperCase()}" is not supported. Please upload a ${label}.`
        );
        return;
      }

      if (file.size > maxSize) {
        setDropState('error');
        setErrorMsg(
          `File is too large (${formatBytes(file.size)}). Maximum allowed size is ${maxLabel}.`
        );
        return;
      }

      setDropState('processing');
      setErrorMsg('');

      // Build the processed file record
      const isMesh = MESH_EXTENSIONS.includes(ext);
      const objectUrl = URL.createObjectURL(file);

      setTimeout(() => {
        setProcessedFile({
          name: file.name,
          type: isMesh ? 'mesh' : 'image',
          url:  objectUrl,
          size: file.size,
        });

        const data: FileData = {
          fileName:  file.name,
          fileSize:  file.size,
          volumeCm3: null,
          fileUrl:   objectUrl,
        };
        setFileData(data);
        setBasePrice(799);
        setDropState('accepted');
      }, 1800);
    },
    [uploadMode, setFileData, setBasePrice]
  );

  const resetFile = useCallback(() => {
    if (processedFile?.url) URL.revokeObjectURL(processedFile.url);
    setProcessedFile(null);
    setFileData(null);
    setBasePrice(0);
    setPreviewGenerated(false);
    setDropState('idle');
    setErrorMsg('');
    if (inputRef.current) inputRef.current.value = '';
  }, [processedFile, setFileData, setBasePrice, setPreviewGenerated]);

  // ── 3D preview generation (gift mode only) ────────────────────────────────────

  const handleGeneratePreview = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setPreviewGenerated(true);
    }, 1500);
  };

  // ── Drag-and-drop handlers ───────────────────────────────────────────────────

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropState !== 'processing') setDropState('dragging');
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropState === 'dragging') setDropState(fileData ? 'accepted' : 'idle');
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropState === 'processing') return;
    const file = e.dataTransfer.files[0];
    if (file) acceptFile(file);
    else setDropState(fileData ? 'accepted' : 'idle');
  };

  const onInputChange  = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) acceptFile(file);
  };

  const onZoneClick    = () => { if (dropState !== 'processing' && !fileData) inputRef.current?.click(); };
  const onZoneKeyDown  = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onZoneClick(); }
  };

  // ── Derived booleans ─────────────────────────────────────────────────────────

  const isDragging   = dropState === 'dragging';
  const isProcessing = dropState === 'processing';
  const isAccepted   = dropState === 'accepted' && fileData !== null;
  const isError      = dropState === 'error';

  // ── Dynamic copy ─────────────────────────────────────────────────────────────

  const placeholderText = uploadMode === 'gift'
    ? 'Drag & drop your photo (JPG, PNG) for custom frames, lamps, or keychains.'
    : 'Drag & drop your engineering assignment model (STL, OBJ) for high-precision printing.';

  const headerLabel = uploadMode === 'gift'
    ? 'Upload Your Photo'
    : 'Upload 3D Project Model';

  const formatHint = uploadMode === 'gift'
    ? 'JPG · JPEG · PNG'
    : 'STL · OBJ';

  const maxHint = uploadMode === 'gift' ? 'Max 25 MB' : 'Max 100 MB';

  const processingText = uploadMode === 'gift'
    ? content.processingText
    : 'Verifying mesh geometry...';

  const processingSubtext = uploadMode === 'gift'
    ? content.processingSubtext
    : 'Checking file integrity for print-ready geometry';

  const acceptAttr = uploadMode === 'gift'
    ? 'image/jpeg,image/png'
    : '.stl,.obj';

  // ── Zone styling ─────────────────────────────────────────────────────────────

  const zoneClasses = [
    'relative flex flex-col items-center justify-center',
    'min-h-[250px] md:min-h-[320px] w-full rounded-2xl border-2 border-dashed',
    'transition-all duration-300 ease-out select-none overflow-hidden',
    isDragging
      ? 'border-accent bg-accent-muted scale-[1.015] cursor-copy'
      : isProcessing
      ? 'border-accent/50 bg-card/30 cursor-wait'
      : isAccepted
      ? 'border-[var(--success)] bg-[var(--success)]/5 cursor-default'
      : isError
      ? 'border-[var(--error)] bg-[var(--error)]/5 cursor-pointer'
      : 'border-card/20 bg-card/30 cursor-pointer hover:border-accent/60 hover:bg-accent-muted hover:scale-[1.005]',
  ].join(' ');

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <section aria-label="File upload" className="flex flex-col gap-3">

      {/* ── Mode Toggle ─────────────────────────────────────────────────────── */}
      <div className="flex justify-center mb-4">
        <div
          className="flex items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-1 gap-1 w-full max-w-xs flex-wrap"
          role="group"
          aria-label="Upload mode"
        >
          <button
            type="button"
            onClick={() => switchMode('gift')}
            className={`flex-1 min-w-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              uploadMode === 'gift'
                ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] shadow-sm'
                : 'text-[var(--text-on-card)] hover:text-[var(--text-on-page)]'
            }`}
            aria-pressed={uploadMode === 'gift'}
          >
            <ImageIcon size={13} />
            Photo Gift
          </button>

          <button
            type="button"
            onClick={() => switchMode('project')}
            className={`flex-1 min-w-0 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              uploadMode === 'project'
                ? 'bg-[var(--bg-accent)] text-[var(--text-on-accent)] shadow-sm'
                : 'text-[var(--text-on-card)] hover:text-[var(--text-on-page)]'
            }`}
            aria-pressed={uploadMode === 'project'}
          >
            <Cpu size={13} />
            3D Project / Assignment
          </button>
        </div>
      </div>

      {/* ── Zone header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <h2 className="heading-section text-base text-on-page">{headerLabel}</h2>
        <span className="text-xs text-on-card">{formatHint}</span>
      </div>

      {/* ── Drop zone ───────────────────────────────────────────────────────── */}
      <div
        className={zoneClasses}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onZoneClick}
        onKeyDown={onZoneKeyDown}
        role="button"
        tabIndex={0}
        aria-label={
          isAccepted
            ? `File accepted: ${fileData.fileName}`
            : `Click or drag a file to upload`
        }
      >
        <input
          ref={inputRef}
          id="file-upload-input"
          type="file"
          accept={acceptAttr}
          className="sr-only"
          onChange={onInputChange}
          aria-hidden="true"
        />

        <div className="flex flex-col items-center gap-5 p-6 w-full text-center">

          {/* IDLE ─────────────────────────────────────────────────────────── */}
          {!isAccepted && !isDragging && !isProcessing && !isError && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center shadow-inner">
                {uploadMode === 'gift'
                  ? <Upload size={28} className="text-bg-accent" strokeWidth={1.5} />
                  : <FileBox size={28} className="text-bg-accent" strokeWidth={1.5} />
                }
              </div>
              <div className="space-y-1.5">
                <p className="text-on-page font-semibold text-sm">{placeholderText}</p>
                <p className="text-xs text-on-card">
                  or{' '}
                  <span className="text-bg-accent underline underline-offset-2">browse your computer</span>
                </p>
              </div>
              <span className="text-[10px] text-on-card bg-card border border-card/25 px-2.5 py-1 rounded-full">
                {maxHint}
              </span>
            </>
          )}

          {/* DRAGGING ───────────────────────────────────────────────────────── */}
          {isDragging && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-accent-muted border-2 border-accent flex items-center justify-center animate-bounce shadow-[0_0_24px_var(--accent-glow)]">
                <Upload size={28} className="text-bg-accent" strokeWidth={1.5} />
              </div>
              <p className="text-bg-accent font-bold text-base">Release to upload</p>
            </>
          )}

          {/* PROCESSING ──────────────────────────────────────────────────────── */}
          {isProcessing && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="animate-spin text-bg-accent" size={32} />
              <div className="space-y-1">
                <p className="text-sm font-medium text-on-page">{processingText}</p>
                <p className="text-xs text-on-card animate-pulse">{processingSubtext}</p>
              </div>
            </div>
          )}

          {/* ACCEPTED — IMAGE PREVIEW (gift mode) ───────────────────────────── */}
          {isAccepted && processedFile?.type === 'image' && processedFile.url && (
            <div className="flex flex-col items-center gap-4 w-full">
              <div className="relative group/preview rounded-lg overflow-hidden border border-secondary/25 max-w-[240px] max-h-[180px] shadow-lg bg-page">
                <img
                  src={processedFile.url}
                  alt="Uploaded photo preview"
                  className="object-contain w-full h-full max-h-[180px] transition-transform duration-300 group-hover/preview:scale-[1.02]"
                />

                {isGenerating && (
                  <div className="absolute inset-0 bg-black/45 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="absolute left-0 right-0 h-1 bg-[var(--bg-accent)] shadow-[0_0_8px_var(--accent-glow)] animate-[scan_1.5s_linear_infinite]" />
                    <Loader2 className="animate-spin text-[var(--bg-accent)] relative z-10" size={24} />
                  </div>
                )}

                {!isGenerating && (
                  <button
                    onClick={(e) => { e.stopPropagation(); resetFile(); }}
                    className="absolute top-2 right-2 bg-card hover:bg-[var(--error)]/10 text-on-card hover:text-[var(--error)] p-1.5 rounded-full shadow-md transition-all duration-200"
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-[var(--success)] flex items-center justify-center gap-1">
                  <CheckCircle size={14} />
                  Image successfully processed
                </p>
                <p className="text-[11px] text-on-card truncate max-w-[250px]" title={processedFile.name}>
                  {processedFile.name} ({formatBytes(processedFile.size)})
                </p>
              </div>

              {!previewGenerated && (
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={(e) => { e.stopPropagation(); handleGeneratePreview(); }}
                  className="btn-accent w-full max-w-[280px] justify-center py-3 text-sm mt-2 flex items-center gap-2 relative overflow-hidden group/btn shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Converting to 3D...
                    </>
                  ) : (
                    <>
                      <Box size={16} className="group-hover/btn:rotate-12 transition-transform duration-300" />
                      Generate 3D Preview &amp; Quote
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* ACCEPTED — MESH FILE CARD (project mode) ────────────────────────── */}
          {isAccepted && processedFile?.type === 'mesh' && (
            <div className="flex flex-col items-center gap-4 w-full">
              {/* Document / gear icon card */}
              <div className="relative w-full max-w-[300px] rounded-xl border border-[var(--border-mid)] bg-[var(--bg-card)] px-5 py-4 flex items-center gap-4 shadow-md">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center">
                  <FileBox size={24} className="text-bg-accent" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold text-on-page truncate"
                    title={processedFile.name}
                  >
                    {processedFile.name}
                  </p>
                  <p className="text-[11px] text-on-card mt-0.5">
                    {formatBytes(processedFile.size)} · Mesh file ready for print
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); resetFile(); }}
                  className="flex-shrink-0 bg-[var(--bg-card)] hover:bg-[var(--error)]/10 text-on-card hover:text-[var(--error)] p-1.5 rounded-full shadow-sm transition-all duration-200"
                  aria-label="Remove file"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-xs font-semibold text-[var(--success)] flex items-center justify-center gap-1">
                <CheckCircle size={14} />
                Mesh file accepted — proceed to material selection
              </p>
            </div>
          )}

          {/* ERROR ───────────────────────────────────────────────────────────── */}
          {isError && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-[var(--error)]/10 border-2 border-[var(--error)] flex items-center justify-center">
                <AlertCircle size={28} className="text-[var(--error)]" strokeWidth={1.5} />
              </div>
              <div className="space-y-1.5">
                <p className="text-[var(--error)] font-semibold text-sm">Invalid File</p>
                <p className="text-xs text-on-card max-w-[260px] leading-relaxed">{errorMsg}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); resetFile(); }}
                className="btn-ghost text-xs py-1.5 px-4 border border-card/25 hover:bg-card/30 text-on-page"
              >
                Try again
              </button>
            </>
          )}

        </div>
      </div>

      {/* Format hint row */}
      <div className="flex items-center justify-between px-1 text-[10px] text-on-card">
        <div className="flex gap-1.5 flex-wrap">
          {(uploadMode === 'gift' ? GIFT_EXTENSIONS : MESH_EXTENSIONS).map((ext) => (
            <span
              key={ext}
              className="font-mono bg-card border border-card/25 px-1.5 py-0.5 rounded"
            >
              {ext.replace('.', '').toUpperCase()}
            </span>
          ))}
        </div>
        <span>{maxHint}</span>
      </div>

      <style>{`
        @keyframes scan {
          0%   { top: 0%;   }
          50%  { top: 100%; }
          100% { top: 0%;   }
        }
      `}</style>
    </section>
  );
}
