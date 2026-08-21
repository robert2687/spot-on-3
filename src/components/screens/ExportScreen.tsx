import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Download,
  Copy,
  Check,
  FileText,
  Database,
  ShieldCheck,
  Calendar,
  Filter,
  Share2,
  Upload,
  Cloud,
  CloudCheck,
  RefreshCw,
  Trash2,
  ExternalLink,
  HardDrive,
  LogOut,
  FolderSync,
} from 'lucide-react';
import { useSpotOn } from '../../context/SpotOnContext';
import { exportToCSV, downloadCSV, formatCurrency } from '../../utils/formatters';
import { Category, Purchase } from '../../types';
import { GoogleSignInButton } from '../GoogleSignInButton';
import { DriveConfirmModal } from '../DriveConfirmModal';
import { DriveFileItem } from '../../services/googleDrive';
import { PremiumModal } from '../insights/PremiumModal';

export const ExportScreen: React.FC = () => {
  const {
    purchases,
    settings,
    presets,
    showToast,
    addPurchase,
    googleUser,
    isGoogleConnected,
    isAuthLoading,
    hasPremium,
    driveFiles,
    isLoadingDriveFiles,
    isSyncingDrive,
    driveQuota,
    lastDriveSync,
    openGoogleAuthModal,
    loginWithGoogle,
    logoutFromGoogle,
    refreshDriveFiles,
    backupToDrive,
    saveCsvToDrive,
    restoreBackupFromDrive,
    deleteFileFromDrive,
    t,
    language,
  } = useSpotOn();

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | Category>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [customBackupNote, setCustomBackupNote] = useState<string>('');
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  // Confirmation modal state for destructive Drive actions
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    details?: string[];
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Filtered dataset for export
  const exportablePurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) {
        return false;
      }
      if (startDate && p.date.slice(0, 10) < startDate) return false;
      if (endDate && p.date.slice(0, 10) > endDate) return false;
      return true;
    });
  }, [purchases, categoryFilter, startDate, endDate]);

  const totalExportSum = useMemo(() => {
    return exportablePurchases.reduce((acc, p) => acc + p.totalPrice, 0);
  }, [exportablePurchases]);

  const generatedCSV = useMemo(() => {
    return exportToCSV(exportablePurchases, settings.currencySymbol);
  }, [exportablePurchases, settings.currencySymbol]);

  // Load drive files on mount if connected
  useEffect(() => {
    if (isGoogleConnected) {
      refreshDriveFiles();
    }
  }, [isGoogleConnected, refreshDriveFiles]);

  const handleDownloadCSV = () => {
    if (exportablePurchases.length === 0) {
      showToast(t('noEntriesToExport'));
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const filename = `spoton_spending_${today}.csv`;
    downloadCSV(generatedCSV, filename);
    showToast(t('downloadedFilename', { filename, count: exportablePurchases.length }));
  };

  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCSV);
      setCopied(true);
      showToast(t('csvCopiedToast'));
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showToast(t('failedCopyToast'));
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(purchases, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `spoton_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(t('jsonBackupExported'));
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              if (item.category && item.price) {
                addPurchase({
                  category: item.category,
                  subcategory: item.subcategory || 'Imported item',
                  price: Number(item.price),
                  quantity: Number(item.quantity) || 1,
                  totalPrice: Number(item.totalPrice) || Number(item.price) * (Number(item.quantity) || 1),
                  place: item.place || 'Shop',
                  date: item.date || new Date().toISOString().slice(0, 16),
                  note: item.note || 'Imported from JSON',
                });
              }
            });
            showToast(t('importedEntriesSuccess', { count: parsed.length }));
          }
        } catch {
          showToast(t('invalidJsonFile'));
        }
      };
      reader.readAsText(file);
    }
  };

  // Google Drive Action Handlers with Confirmation Modals
  const handleSaveBackupToDrive = async () => {
    const note = customBackupNote.trim() || undefined;
    const ok = await backupToDrive(note);
    if (ok) {
      setCustomBackupNote('');
    }
  };

  const handleSaveCsvToDrive = async () => {
    if (exportablePurchases.length === 0) {
      showToast(t('noEntriesExportDrive'));
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const filename = `spoton_spending_${today}.csv`;
    await saveCsvToDrive(generatedCSV, filename);
  };

  const handlePromptRestoreFromDrive = (file: DriveFileItem) => {
    setConfirmModal({
      isOpen: true,
      title: t('restoreDrivePromptTitle'),
      description: t('restoreDrivePromptDesc', { name: file.name }),
      details: [
        t('fileNameLabel', { name: file.name }),
        t('savedTimeLabel', { time: new Date(file.modifiedTime).toLocaleString(language) }),
        t('currentRecordsUpdateLabel', { count: purchases.length }),
      ],
      confirmLabel: t('restoreDataButton'),
      isDestructive: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await restoreBackupFromDrive(file.id);
      },
    });
  };

  const handlePromptDeleteFromDrive = (file: DriveFileItem) => {
    setConfirmModal({
      isOpen: true,
      title: t('deleteDrivePromptTitle'),
      description: t('deleteDrivePromptDesc', { name: file.name }),
      details: [
        t('fileNameLabel', { name: file.name }),
        t('createdTimeLabel', { time: new Date(file.createdTime).toLocaleString(language) }),
      ],
      confirmLabel: t('deletePermanentlyButton'),
      isDestructive: true,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await deleteFileFromDrive(file.id);
      },
    });
  };

  // Format bytes helper
  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return '0 MB';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '0 MB';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="space-y-5 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('exportScreenTitle')}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('exportCloudSyncSubtitle')}
        </p>
      </div>

      {/* Google Drive Integration Hub */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                {t('googleDriveSyncTitle')}
                {isGoogleConnected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {t('googleDriveConnected', { name: '' }).trim() || 'Connected'}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('securelyStoreRestoreDesc')}
              </p>
            </div>
          </div>

          {isGoogleConnected && (
            <button
              onClick={() => refreshDriveFiles()}
              disabled={isLoadingDriveFiles}
              title="Refresh Google Drive files"
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDriveFiles ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {!isGoogleConnected ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 space-y-3">
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {t('connectGoogleDesc')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <GoogleSignInButton
                onClick={() => loginWithGoogle()}
                isLoading={isAuthLoading}
                text={t('googleSignIn')}
                className="w-full"
              />
              <button
                type="button"
                onClick={() => openGoogleAuthModal('signup')}
                className="w-full py-2.5 px-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold text-xs hover:bg-blue-100/60 dark:hover:bg-blue-900/60 transition flex items-center justify-center gap-1.5"
              >
                <span>{t('googleSignUp')}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* User Profile & Quota info */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {googleUser?.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google Account'}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full ring-2 ring-blue-500/20 object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                    {googleUser?.displayName?.charAt(0) || googleUser?.email?.charAt(0) || 'G'}
                  </div>
                )}
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block">
                    {googleUser?.displayName || 'Google User'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate max-w-[180px] sm:max-w-xs">
                    {googleUser?.email}
                  </span>
                </div>
              </div>

              <button
                onClick={() => logoutFromGoogle()}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('disconnect')}</span>
              </button>
            </div>

            {/* Storage Quota info */}
            {driveQuota && (
              <div className="px-3.5 py-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{t('googleDriveStorage')}</span>
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatBytes(driveQuota.usage)} / {formatBytes(driveQuota.limit)}
                </span>
              </div>
            )}

            {/* 1-Click Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleSaveBackupToDrive}
                disabled={isSyncingDrive}
                className="py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                {isSyncingDrive ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FolderSync className="w-4 h-4" />
                )}
                <span>{t('oneTapDriveBackup', { count: purchases.length })}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCsvToDrive}
                disabled={isSyncingDrive || exportablePurchases.length === 0}
                className="py-3 px-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>{t('saveCsvToDriveButton')}</span>
              </button>
            </div>

            {/* Drive Files List / Backups */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  {t('filesInGoogleDrive', { count: driveFiles.length })}
                </span>
                {lastDriveSync && (
                  <span className="text-[10px] text-slate-400">
                    {t('lastSyncTime', { time: lastDriveSync })}
                  </span>
                )}
              </div>

              {isLoadingDriveFiles ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>{t('loadingFilesGoogleDrive')}</span>
                </div>
              ) : driveFiles.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 text-center text-xs text-slate-500">
                  {t('noSpotOnBackupsYet')}
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
                  {driveFiles.map((file) => {
                    const isJson = file.name.endsWith('.json');
                    const isCsv = file.name.endsWith('.csv');

                    return (
                      <div
                        key={file.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <div className={`p-2 rounded-xl shrink-0 ${
                            isCsv
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                          }`}>
                            {isCsv ? <FileText className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white block truncate">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {new Date(file.modifiedTime).toLocaleDateString(language, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {file.size ? ` · ${formatBytes(file.size)}` : ''}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {isJson && (
                            <button
                              type="button"
                              onClick={() => handlePromptRestoreFromDrive(file)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-bold text-[11px] transition"
                              title="Restore data from this backup"
                            >
                              {t('restoreBackup')}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handlePromptDeleteFromDrive(file)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Delete file from Google Drive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Local Export Scope & CSV Generator */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>{t('localExportAndFilters')}</span>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
            {t('categorySelect')}
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`py-1.5 rounded-lg transition ${
                categoryFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t('filterAllBadges')}
            </button>
            <button
              onClick={() => setCategoryFilter('alcohol')}
              className={`py-1.5 rounded-lg transition ${
                categoryFilter === 'alcohol'
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t('alcohol')}
            </button>
            <button
              onClick={() => setCategoryFilter('tobacco')}
              className={`py-1.5 rounded-lg transition ${
                categoryFilter === 'tobacco'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t('tobacco')}
            </button>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {t('startDateOptional')}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {t('endDateOptional')}
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {t('selectedItemsSummary', { count: exportablePurchases.length })}
          </span>
          <span className="text-slate-500 dark:text-slate-400">
            {t('totalValueSummary', { amount: formatCurrency(totalExportSum, settings.currencySymbol) })}
          </span>
        </div>

  {/* Download CSV, PDF & Copy Actions */}
  <div className="space-y-2 pt-1">
  <button type="button" onClick={() => hasPremium ? showToast('PDF report generation is ready for your selected data.') : setIsPremiumModalOpen(true)} className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"><FileText className="mr-2 inline size-4" />{hasPremium ? 'Download PDF report' : 'Unlock PDF reports'}</button>
          <button
            onClick={handleDownloadCSV}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-98 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            {t('downloadCsvFile')}
          </button>

          <button
            onClick={handleCopyClipboard}
            className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4 text-blue-600" /> : <Copy className="w-4 h-4" />}
            {copied ? t('copiedToClipboard') : t('copyCsvClipboard')}
          </button>
        </div>
      </div>

      {/* Local JSON Backup & Restore section */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          <Database className="w-3.5 h-3.5" />
          <span>{t('jsonBackupTitle')}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportJSON}
            className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            {t('saveFile')}
          </button>

          <label className="py-2.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
            {t('restoreFile')}
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Destructive Operations */}
  <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} feature="PDF reports" />
  <DriveConfirmModal
  isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        details={confirmModal.details}
        confirmLabel={confirmModal.confirmLabel}
        isDestructive={confirmModal.isDestructive}
        isLoading={isSyncingDrive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
