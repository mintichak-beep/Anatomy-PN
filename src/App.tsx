import { useState, useEffect, useMemo } from 'react';
import {
  AnatomyTerm,
  AppView,
  CustomPlate,
  ExamAnswerRecord,
  ExamConfig,
  ExamGrade,
  ExamSessionRecord,
  StudentRosterEntry,
  SystemId,
} from './types/anatomy';
import { ANATOMY_SYSTEMS, BUILT_IN_TERMS } from './data/anatomyData';
import { SetupLobby } from './components/SetupLobby';
import { LiveExamView } from './components/LiveExamView';
import { ExamSummaryView } from './components/ExamSummaryView';
import { LibraryManagerView } from './components/LibraryManagerView';
import { HistoryView } from './components/HistoryView';
import { CustomPlateBuilderModal } from './components/CustomPlateBuilderModal';
import { RosterModal } from './components/RosterModal';

const STORAGE_HISTORY_KEY = 'anatomia_oral_history_v1';
const STORAGE_CUSTOM_TERMS_KEY = 'anatomia_oral_custom_terms_v1';
const STORAGE_CUSTOM_PLATES_KEY = 'anatomia_oral_custom_plates_v1';
const STORAGE_ROSTER_KEY = 'anatomia_oral_roster_v1';

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  const [view, setView] = useState<AppView>('setup');

  const [customTerms, setCustomTerms] = useState<AnatomyTerm[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_TERMS_KEY);
      return raw ? (JSON.parse(raw) as AnatomyTerm[]) : [];
    } catch {
      return [];
    }
  });

  const [customPlates, setCustomPlates] = useState<CustomPlate[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CUSTOM_PLATES_KEY);
      return raw ? (JSON.parse(raw) as CustomPlate[]) : [];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState<ExamSessionRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
      return raw ? (JSON.parse(raw) as ExamSessionRecord[]) : [];
    } catch {
      return [];
    }
  });

  const [roster, setRoster] = useState<StudentRosterEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ROSTER_KEY);
      return raw ? (JSON.parse(raw) as StudentRosterEntry[]) : [];
    } catch {
      return [];
    }
  });

  const [config, setConfig] = useState<ExamConfig>({
    studentName: '',
    studentId: '',
    seatNumber: '',
    selectedCustomPlateIds: customPlates.map((p) => p.id),
    termsPerSystem: 1,
    secondsPerQuestion: 30,
    showThaiInPrompt: false,
    shuffle: true,
    autoStartTimer: true,
  });

  const [activeExamTerms, setActiveExamTerms] = useState<AnatomyTerm[]>([]);
  const [activeSession, setActiveSession] = useState<ExamSessionRecord | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingPlate, setEditingPlate] = useState<CustomPlate | null>(null);
  const [builderDefaultSystemId, setBuilderDefaultSystemId] = useState<SystemId>('respiratory');
  const [rosterOpen, setRosterOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_TERMS_KEY, JSON.stringify(customTerms));
    } catch {
      // Ignore storage quota errors
    }
  }, [customTerms]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CUSTOM_PLATES_KEY, JSON.stringify(customPlates));
    } catch {
      // Ignore storage quota errors
    }
  }, [customPlates]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage quota errors
    }
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ROSTER_KEY, JSON.stringify(roster));
    } catch {
      // Ignore storage quota errors
    }
  }, [roster]);

  const allTerms = useMemo(
    () => [...customTerms, ...BUILT_IN_TERMS],
    [customTerms]
  );

  const buildExamPool = (cfg: ExamConfig): AnatomyTerm[] => {
    const selectedPlates = customPlates.filter((p) =>
      cfg.selectedCustomPlateIds.includes(p.id)
    );

    const perSystemResult: AnatomyTerm[] = [];

    for (const sys of ANATOMY_SYSTEMS) {
      const sysPlates = selectedPlates.filter((p) => p.systemId === sys.id);
      const sysPool: AnatomyTerm[] = [];

      for (const plate of sysPlates) {
        for (const pt of plate.terms) {
          sysPool.push({
            id: `${plate.id}-${pt.id}`,
            systemId: pt.systemId,
            termEn: pt.termEn,
            termTh: pt.termTh,
            customImageUrl: plate.imageUrl,
            customPlateTitle: plate.title,
            isCustom: true,
          });
        }
      }

      if (sysPool.length === 0) continue;

      // Always randomize within the system so each student gets a random term for that system
      const randomizedSysPool = shuffleArray(sysPool);
      const chosen =
        cfg.termsPerSystem === 0
          ? randomizedSysPool
          : randomizedSysPool.slice(0, cfg.termsPerSystem);
      perSystemResult.push(...chosen);
    }

    return perSystemResult;
  };

  const startExamWithConfig = (cfg: ExamConfig) => {
    const pool = buildExamPool(cfg);
    if (pool.length === 0) return;

    const ordered = cfg.shuffle ? shuffleArray(pool) : pool;
    setActiveExamTerms(ordered);
    setView('exam');
  };

  const handleCompleteExam = (answers: ExamAnswerRecord[], startedAt: string) => {
    const totalScore = answers.reduce((acc, a) => acc + a.score, 0);
    const maxScore = answers.length * 2;
    const systemIdsInExam = Array.from(new Set(answers.map((a) => a.systemId)));
    const session: ExamSessionRecord = {
      id: `exam-${Date.now()}`,
      studentName: config.studentName.trim() || 'นักศึกษา (ไม่ระบุชื่อ)',
      studentId: config.studentId.trim(),
      seatNumber: config.seatNumber.trim(),
      systemIds: systemIdsInExam,
      totalQuestions: answers.length,
      totalScore,
      maxScore,
      secondsPerQuestion: config.secondsPerQuestion,
      startedAt,
      completedAt: new Date().toISOString(),
      answers,
    };

    setHistory((prev) => [session, ...prev]);
    setActiveSession(session);
    setView('summary');
  };

  const handleStartNextStudent = () => {
    setConfig((prev) => ({ ...prev, studentName: '', studentId: '', seatNumber: '' }));
    setView('setup');
  };

  const handleAddCustomTerm = (term: AnatomyTerm) => {
    setCustomTerms((prev) => [term, ...prev]);
  };

  const handleDeleteCustomTerm = (id: string) => {
    setCustomTerms((prev) => prev.filter((t) => t.id !== id));
  };

  const handleQuickUploadForSystem = (systemId: SystemId, imageUrl: string) => {
    const sys = ANATOMY_SYSTEMS.find((s) => s.id === systemId);
    const sysTerms = allTerms
      .filter((t) => t.systemId === systemId)
      .map((t) => ({
        id: `cpt-${t.id}`,
        systemId: t.systemId,
        termEn: t.termEn,
        termTh: t.termTh,
      }));

    const existingCount = customPlates.filter((p) => p.systemId === systemId).length;
    const newPlate: CustomPlate = {
      id: `plate-${Date.now()}`,
      title: existingCount > 0 ? `${sys?.nameTh || systemId} (ชุดที่ ${existingCount + 1})` : sys?.nameTh || systemId,
      systemId,
      imageUrl,
      terms: sysTerms,
      createdAt: new Date().toISOString(),
    };

    setCustomPlates((prev) => [newPlate, ...prev]);
    setConfig((prev) => ({
      ...prev,
      selectedCustomPlateIds: [...prev.selectedCustomPlateIds, newPlate.id],
    }));
  };

  const handleSaveCustomPlate = (plate: CustomPlate) => {
    setCustomPlates((prev) => {
      const exists = prev.some((p) => p.id === plate.id);
      if (exists) {
        return prev.map((p) => (p.id === plate.id ? plate : p));
      }
      return [plate, ...prev];
    });
    setConfig((prev) => ({
      ...prev,
      selectedCustomPlateIds: prev.selectedCustomPlateIds.includes(plate.id)
        ? prev.selectedCustomPlateIds
        : [...prev.selectedCustomPlateIds, plate.id],
    }));
    setBuilderOpen(false);
    setEditingPlate(null);
  };

  const handleDeleteCustomPlate = (id: string) => {
    setCustomPlates((prev) => prev.filter((p) => p.id !== id));
    setConfig((prev) => ({
      ...prev,
      selectedCustomPlateIds: prev.selectedCustomPlateIds.filter((pid) => pid !== id),
    }));
  };

  const handleDeleteSession = (id: string) => {
    setHistory((prev) => prev.filter((s) => s.id !== id));
  };

  const handleClearAllHistory = () => {
    setHistory([]);
  };

  const handleUpdateItemScore = (sessionId: string, termId: string, newScore: ExamGrade) => {
    const updateRecord = (s: ExamSessionRecord): ExamSessionRecord => {
      if (s.id !== sessionId) return s;
      const nextAnswers = s.answers.map((a) =>
        a.termId === termId ? { ...a, score: newScore } : a
      );
      const nextTotal = nextAnswers.reduce((acc, a) => acc + a.score, 0);
      return { ...s, answers: nextAnswers, totalScore: nextTotal };
    };

    setHistory((prev) => prev.map(updateRecord));
    setActiveSession((prev) => (prev ? updateRecord(prev) : prev));
  };

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 ${
      active
        ? 'text-slate-900 border-sky-700'
        : 'text-slate-600 border-transparent hover:text-slate-900'
    }`;

  const canQuickStart = buildExamPool(config).length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setView('setup')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Anatomia Oral
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <button
              type="button"
              onClick={() => setView('setup')}
              className={navLinkClass(view === 'setup')}
            >
              จัดชุดสอบ
            </button>
            {activeExamTerms.length > 0 && view === 'exam' && (
              <button
                type="button"
                onClick={() => setView('exam')}
                className={navLinkClass(view === 'exam')}
              >
                ห้องสอบปัจจุบัน
              </button>
            )}
            <button
              type="button"
              onClick={() => setView('library')}
              className={navLinkClass(view === 'library')}
            >
              คลังคำศัพท์ 8 ระบบ
            </button>
            <button
              type="button"
              onClick={() => setView('history')}
              className={navLinkClass(view === 'history')}
            >
              ประวัติผลสอบ ({history.length})
            </button>
          </nav>

          <div className="shrink-0">
            {view === 'exam' ? (
              <button
                type="button"
                onClick={() => setView('setup')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                กลับหน้าตั้งค่า
              </button>
            ) : (
              <button
                type="button"
                disabled={!canQuickStart}
                onClick={() => startExamWithConfig(config)}
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 disabled:bg-slate-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                เริ่มสอบทันที
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav Strip */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-100 px-3 py-2 bg-white">
          <button
            type="button"
            onClick={() => setView('setup')}
            className={`text-xs font-medium px-2 py-1 ${
              view === 'setup' ? 'text-sky-700 font-semibold' : 'text-slate-600'
            }`}
          >
            จัดชุดสอบ
          </button>
          <button
            type="button"
            onClick={() => setView('library')}
            className={`text-xs font-medium px-2 py-1 ${
              view === 'library' ? 'text-sky-700 font-semibold' : 'text-slate-600'
            }`}
          >
            คลังคำศัพท์ 8 ระบบ
          </button>
          <button
            type="button"
            onClick={() => setView('history')}
            className={`text-xs font-medium px-2 py-1 ${
              view === 'history' ? 'text-sky-700 font-semibold' : 'text-slate-600'
            }`}
          >
            ประวัติ ({history.length})
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {view === 'setup' && (
          <SetupLobby
            systems={ANATOMY_SYSTEMS}
            allTerms={allTerms}
            customPlates={customPlates}
            roster={roster}
            history={history}
            config={config}
            onChangeConfig={setConfig}
            onStartExam={() => startExamWithConfig(config)}
            onOpenLibrary={() => setView('library')}
            onQuickUploadForSystem={handleQuickUploadForSystem}
            onOpenCustomPlateBuilder={(plate, sysId) => {
              setEditingPlate(plate || null);
              setBuilderDefaultSystemId(sysId || plate?.systemId || 'respiratory');
              setBuilderOpen(true);
            }}
            onDeleteCustomPlate={handleDeleteCustomPlate}
            onOpenRosterModal={() => setRosterOpen(true)}
          />
        )}

        {view === 'exam' && activeExamTerms.length > 0 && (
          <LiveExamView
            terms={activeExamTerms}
            systems={ANATOMY_SYSTEMS}
            config={config}
            onCompleteExam={handleCompleteExam}
            onCancelExam={() => setView('setup')}
          />
        )}

        {view === 'summary' && activeSession && (
          <ExamSummaryView
            session={activeSession}
            systems={ANATOMY_SYSTEMS}
            onStartNextStudent={handleStartNextStudent}
            onRetakeSameConfig={() => startExamWithConfig(config)}
            onOpenHistory={() => setView('history')}
            onUpdateItemScore={handleUpdateItemScore}
          />
        )}

        {view === 'library' && (
          <LibraryManagerView
            systems={ANATOMY_SYSTEMS}
            terms={allTerms}
            onAddCustomTerm={handleAddCustomTerm}
            onDeleteCustomTerm={handleDeleteCustomTerm}
          />
        )}

        {view === 'history' && (
          <HistoryView
            sessions={history}
            systems={ANATOMY_SYSTEMS}
            onViewSession={(s) => {
              setActiveSession(s);
              setView('summary');
            }}
            onDeleteSession={handleDeleteSession}
            onClearAllHistory={handleClearAllHistory}
            onStartNewExam={() => setView('setup')}
          />
        )}
      </main>

      {/* Custom Plate Builder Modal */}
      {builderOpen && (
        <CustomPlateBuilderModal
          systems={ANATOMY_SYSTEMS}
          allTerms={allTerms}
          initialPlate={editingPlate}
          initialSystemId={builderDefaultSystemId}
          onSave={handleSaveCustomPlate}
          onClose={() => {
            setBuilderOpen(false);
            setEditingPlate(null);
          }}
        />
      )}

      {/* Student Roster Modal */}
      {rosterOpen && (
        <RosterModal
          roster={roster}
          onSaveRoster={setRoster}
          onSelectStudent={(stu) =>
            setConfig((prev) => ({
              ...prev,
              seatNumber: stu.seatNumber,
              studentId: stu.studentId,
              studentName: stu.studentName,
            }))
          }
          onClose={() => setRosterOpen(false)}
        />
      )}
    </div>
  );
}
