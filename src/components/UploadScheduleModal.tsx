import React, { useState, useRef } from 'react';
import { Task, DayId } from '../types';
import { CalendarDay, getTaskColor, getTodayDayId } from '../utils/dateUtils';
import { zenAudio } from '../utils/audio';

interface UploadScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBatchActivities: (newActivities: Task[]) => void;
  weekDays: CalendarDay[];
}

interface EditableExtractedItem {
  id: string;
  title: string;
  dayId: DayId;
  time: string;
  endTime: string;
  duration?: string;
  repeat: 'once' | 'weekly' | 'monthly' | 'yearly';
  locked: boolean;
  category: string;
  notes: string;
}

const ALL_DAYS: { id: DayId; label: string }[] = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export const UploadScheduleModal: React.FC<UploadScheduleModalProps> = ({
  isOpen,
  onClose,
  onAddBatchActivities,
  weekDays,
}) => {
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [scheduleTitle, setScheduleTitle] = useState('Extracted Schedule');
  const [extractedItems, setExtractedItems] = useState<EditableExtractedItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setErrorMessage('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile || !imagePreviewUrl) return;

    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      const todayId = getTodayDayId();
      const payload = {
        imageBase64: imagePreviewUrl,
        mimeType: selectedFile.type || 'image/jpeg',
        currentDayId: todayId,
        weekDays: weekDays.map((w) => ({
          dayId: w.dayId,
          dayName: w.dayName,
          dateKey: w.dateKey,
        })),
      };

      const res = await fetch('/api/gemini/parse-schedule-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.activities && Array.isArray(data.activities) && data.activities.length > 0) {
        setScheduleTitle(data.scheduleTitle || 'Extracted Schedule');
        setExtractedItems(
          data.activities.map((a: any, idx: number) => ({
            id: `item-${Date.now()}-${idx}`,
            title: a.title || 'Scheduled Activity',
            dayId: (a.dayId as DayId) || todayId,
            time: a.time || '09:00',
            endTime: a.endTime || '10:00',
            duration: a.duration || '1h',
            repeat: a.repeat === 'once' || a.repeat === 'monthly' || a.repeat === 'yearly' ? a.repeat : 'weekly',
            locked: Boolean(a.locked),
            category: a.category || 'Focus',
            notes: a.notes || '',
          }))
        );
        setStep('review');
        zenAudio.playChime();
      } else {
        throw new Error(data.message || 'Could not parse any activities from this image.');
      }
    } catch (err: any) {
      console.error('Image analysis error:', err);
      setErrorMessage(err.message || 'AI could not read the schedule from this image. Please try another image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<EditableExtractedItem>) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setExtractedItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddItem = () => {
    const todayId = getTodayDayId();
    const newItem: EditableExtractedItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: 'New Activity',
      dayId: todayId,
      time: '10:00',
      endTime: '11:00',
      duration: '1h',
      repeat: 'weekly',
      locked: false,
      category: 'Focus',
      notes: '',
    };
    setExtractedItems((prev) => [...prev, newItem]);
  };

  const handleConfirmAndAddToSchedule = () => {
    if (extractedItems.length === 0) return;

    const newTasks: Task[] = extractedItems.map((item) => {
      const matchedDay = weekDays.find((d) => d.dayId === item.dayId);
      return {
        id: `img-act-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: item.title.trim() || 'Untitled Activity',
        dayId: item.dayId,
        dateKey: matchedDay?.dateKey,
        time: item.time || '09:00',
        endTime: item.endTime || '10:00',
        duration: item.duration || '1h',
        category: item.category || 'Focus',
        repeat: item.repeat || 'weekly',
        locked: Boolean(item.locked),
        notes: item.notes || '',
        color: getTaskColor(item.title),
        completed: false,
        status: 'todo',
        isBatchAi: true,
      };
    });

    onAddBatchActivities(newTasks);
    zenAudio.playChime();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
    >
      <div className="relative w-full max-w-[720px] max-h-[90vh] bg-white dark:bg-[#18191d] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-black/[0.08] dark:border-white/[0.1] flex flex-col overflow-hidden">
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#2e4faa] to-transparent"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-black/[0.05] dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2e4faa]/10 dark:bg-[#2e4faa]/20 text-[#2e4faa] dark:text-[#7d9eff] flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px]">photo_camera</span>
            </div>
            <div>
              <h2 className="font-headline font-semibold text-lg text-[#1b1c19] dark:text-white">
                {step === 'upload' ? 'Upload Schedule via Image' : scheduleTitle}
              </h2>
              <p className="text-xs text-[#747878] dark:text-[#a1a1aa]">
                {step === 'upload'
                  ? 'AI reads your timetable photo or screenshot and adds it to your week'
                  : `Review and customize ${extractedItems.length} activities before adding to Week at a Glance`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#444748] dark:text-[#a1a1aa] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {step === 'upload' && (
            <div className="flex flex-col gap-4">
              {/* Mandatory User Warning Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-900 dark:text-amber-200">
                <span className="material-symbols-outlined text-[20px] text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                  info
                </span>
                <p className="text-xs font-semibold leading-relaxed">
                  The image uploaded should have the time and names properly displayed for a better review
                </p>
              </div>

              {/* Upload Dropzone */}
              {!imagePreviewUrl ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-black/[0.15] dark:border-white/[0.15] hover:border-[#2e4faa] dark:hover:border-[#7d9eff] rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer transition-colors bg-[#fbf9f4]/50 dark:bg-[#202126]/50 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-14 h-14 rounded-full bg-[#2e4faa]/10 dark:bg-[#2e4faa]/20 text-[#2e4faa] dark:text-[#7d9eff] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">upload_file</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[#1b1c19] dark:text-white">
                      Drop your timetable image here, or{' '}
                      <span className="text-[#2e4faa] dark:text-[#7d9eff] underline">browse</span>
                    </p>
                    <p className="text-xs text-[#747878] dark:text-[#a1a1aa] mt-0.5">
                      Supports JPG, PNG, WEBP (school syllabi, weekly planners, screenshots)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="relative rounded-xl overflow-hidden border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] max-h-72 flex items-center justify-center p-2">
                    <img
                      src={imagePreviewUrl}
                      alt="Uploaded schedule preview"
                      className="max-h-64 object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setImagePreviewUrl(null);
                      }}
                      className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white rounded-full p-1.5 shadow-md transition-colors"
                      title="Remove image"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#747878] dark:text-[#a1a1aa] px-1">
                    <span className="truncate max-w-[300px]">{selectedFile?.name}</span>
                    <span>
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''}
                    </span>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                  {errorMessage}
                </div>
              )}
            </div>
          )}

          {step === 'review' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1b1c19] dark:text-white">
                  {extractedItems.length} Activities Detected
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-xs text-[#2e4faa] dark:text-[#7d9eff] font-semibold hover:underline"
                >
                  <span className="material-symbols-outlined text-[15px]">add</span>
                  <span>Add Another Activity</span>
                </button>
              </div>

              {/* Editable Cards */}
              <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {extractedItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#f5f3ee]/60 dark:bg-[#202126]/60 border border-black/[0.05] dark:border-white/[0.06] flex flex-col gap-3"
                  >
                    {/* Top Row: Title + Lock Toggle + Delete */}
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getTaskColor(item.title) }}
                      />
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                        className="flex-1 bg-transparent font-semibold text-xs text-[#1b1c19] dark:text-white focus:outline-none border-b border-black/[0.08] dark:border-white/[0.1] pb-0.5"
                        placeholder="Activity name"
                      />

                      {/* Lock Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleUpdateItem(item.id, { locked: !item.locked })}
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          item.locked
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            : 'text-[#444748] dark:text-[#a1a1aa] hover:bg-black/[0.05]'
                        }`}
                        title={item.locked ? 'Locked in place (cannot drag)' : 'Unlocked (draggable)'}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {item.locked ? 'lock' : 'lock_open'}
                        </span>
                      </button>

                      {/* Delete item */}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>

                    {/* Middle Row: Day, Start Time, End Time, Category */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {/* Day Selector */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-[#747878] dark:text-[#a1a1aa] uppercase">
                          Day
                        </label>
                        <select
                          value={item.dayId}
                          onChange={(e) =>
                            handleUpdateItem(item.id, { dayId: e.target.value as DayId })
                          }
                          className="bg-white dark:bg-[#18191d] px-2 py-1 rounded-lg border border-black/[0.06] dark:border-white/[0.08] font-semibold text-xs"
                        >
                          {ALL_DAYS.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Start Time */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-[#747878] dark:text-[#a1a1aa] uppercase">
                          Start
                        </label>
                        <input
                          type="time"
                          value={item.time}
                          onChange={(e) => handleUpdateItem(item.id, { time: e.target.value })}
                          className="bg-white dark:bg-[#18191d] px-2 py-1 rounded-lg border border-black/[0.06] dark:border-white/[0.08] font-mono text-xs"
                        />
                      </div>

                      {/* End Time */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-[#747878] dark:text-[#a1a1aa] uppercase">
                          End
                        </label>
                        <input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => handleUpdateItem(item.id, { endTime: e.target.value })}
                          className="bg-white dark:bg-[#18191d] px-2 py-1 rounded-lg border border-black/[0.06] dark:border-white/[0.08] font-mono text-xs"
                        />
                      </div>

                      {/* Category */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-semibold text-[#747878] dark:text-[#a1a1aa] uppercase">
                          Category
                        </label>
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                          placeholder="e.g. Focus"
                          className="bg-white dark:bg-[#18191d] px-2 py-1 rounded-lg border border-black/[0.06] dark:border-white/[0.08] text-xs"
                        />
                      </div>
                    </div>

                    {/* Bottom Row: Repeat Cadence */}
                    <div className="flex items-center justify-between pt-1 border-t border-black/[0.03] dark:border-white/[0.04]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-[#747878] dark:text-[#a1a1aa] uppercase">
                          Repeat:
                        </span>
                        {(['once', 'weekly', 'monthly', 'yearly'] as const).map((rep) => (
                          <button
                            key={rep}
                            type="button"
                            onClick={() => handleUpdateItem(item.id, { repeat: rep })}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-all ${
                              item.repeat === rep
                                ? 'bg-[#2e4faa] text-white shadow-xs'
                                : 'bg-black/[0.03] dark:bg-white/[0.04] text-[#444748] dark:text-[#a1a1aa] hover:bg-black/[0.06]'
                            }`}
                          >
                            {rep}
                          </button>
                        ))}
                      </div>

                      {item.locked && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">lock</span>
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between bg-[#fbf9f4]/40 dark:bg-[#141518]/40">
          {step === 'upload' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#444748] dark:text-[#a1a1aa] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedFile || isAnalyzing}
                onClick={handleStartAnalysis}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#2e4faa] text-white hover:opacity-90 active:scale-95 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>AI Reviewing Image...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    <span>Review with AI</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#444748] dark:text-[#a1a1aa] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors"
              >
                Back to Image
              </button>
              <button
                type="button"
                onClick={handleConfirmAndAddToSchedule}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#2e4faa] text-white hover:opacity-90 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check</span>
                <span>Add All to Week at a Glance ({extractedItems.length})</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
