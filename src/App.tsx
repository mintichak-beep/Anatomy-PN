import { useState, useEffect, useMemo, useRef } from 'react';
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
import {
  syncCustomPlates,
  syncCustomTerms,
  syncHistory,
  syncRoster,
  syncSettings,
  savePlateToFirebase,
  deletePlateFromFirebase,
  saveTermToFirebase,
  deleteTermFromFirebase,
  saveRosterToFirebase,
  saveRosterEntryToFirebase,
  deleteRosterEntryFromFirebase,
  saveSessionToFirebase,
  deleteSessionFromFirebase,
  clearHistoryInFirebase,
  clearRosterInFirebase,
  updateExamDescriptionInFirebase,
} from './services/firebaseSync';
import { Cloud } from 'lucide-react';


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

  const [customTerms, setCustomTerms] = useState<AnatomyTerm[]>([]);
  const [customPlates, setCustomPlates] = useState<CustomPlate[]>([]);
  const [history, setHistory] = useState<ExamSessionRecord[]>([]);
  const [roster, setRoster] = useState<StudentRosterEntry[]>([]);
  const [examDescription, setExamDescription] = useState<string>('');

  const [config, setConfig] = useState<ExamConfig>({
    studentName: '',
    studentId: '',
    seatNumber: '',
    selectedCustomPlateIds: customPlates.map((p) => p.id),
    examScope: 'all8',
    termsPerSystem: 1,
    secondsPerQuestion: 30,
    shuffle: false,
    autoStartTimer: true,
  });


  const seenPlateIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsubs = [
      syncCustomPlates((plates) => {
        setCustomPlates(plates);
        const newIds: string[] = [];
        for (const p of plates) {
          if (!seenPlateIdsRef.current.has(p.id)) {
            seenPlateIdsRef.current.add(p.id);
            newIds.push(p.id);
          }
        }
        if (newIds.length > 0) {
          setConfig((prev) => ({
            ...prev,
            selectedCustomPlateIds: Array.from(
              new Set([...prev.selectedCustomPlateIds, ...newIds])
            ),
          }));
        }
      }),
      syncCustomTerms(setCustomTerms),
      syncHistory(setHistory),
      syncRoster(setRoster),
      syncSettings(setExamDescription),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const [activeExamTerms, setActiveExamTerms] = useState<AnatomyTerm[]>([]);
  const [activeSession, setActiveSession] = useState<ExamSessionRecord | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingPlate, setEditingPlate] = useState<CustomPlate | null>(null);
  const [builderDefaultSystemId, setBuilderDefaultSystemId] = useState<SystemId>('respiratory');
  const [builderQuickImageUrl, setBuilderQuickImageUrl] = useState<string>('');
  const [rosterOpen, setRosterOpen] = useState(false);

  // Local state persistence removed in favor of Firebase sync
  // (Dependencies on user for sync handled above)

  const allTerms = useMemo(
    () => [...customTerms, ...BUILT_IN_TERMS],
    [customTerms]
  );

  const buildExamPool = (cfg: ExamConfig): AnatomyTerm[] => {
    const selectedPlates = customPlates.filter((p) =>
      cfg.selectedCustomPlateIds.includes(p.id)
    );

    // Track how many times each term has already been asked across the ~30 students
    const usageCount = new Map<string, number>();
    const lastUsedTermBySys = new Map<SystemId, string>();
    for (let i = history.length - 1; i >= 0; i--) {
      for (const ans of history[i].answers) {
        const key = `${ans.systemId}::${ans.termEn.toLowerCase()}`;
        usageCount.set(key, (usageCount.get(key) || 0) + 1);
      }
    }
    if (history.length > 0) {
      for (const ans of history[0].answers) {
        lastUsedTermBySys.set(ans.systemId, ans.termEn.toLowerCase());
      }
    }

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
            targetX: pt.targetX,
            targetY: pt.targetY,
            isCustom: true,
          });
        }
      }

      if (sysPool.length === 0) {
        if (cfg.examScope === 'uploadedOnly') continue;
        // Include system using built-in/custom terms (no standard image) when testing all 8 systems
        const bankTerms = allTerms.filter((t) => t.systemId === sys.id);
        if (bankTerms.length === 0) continue;
        sysPool.push(...bankTerms);
      }

      // If instructor pinned laser spots for this system, randomly draw from the pinned spots
      const pinnedPool = sysPool.filter(
        (t) => t.targetX !== undefined && t.targetY !== undefined
      );
      const effectiveSysPool = pinnedPool.length > 0 ? pinnedPool : sysPool;

      // Shuffle first, then sort by least-asked count (and avoid repeating the immediately prior student's term)
      const prevTerm = lastUsedTermBySys.get(sys.id);
      const randomizedSysPool = shuffleArray(effectiveSysPool).sort((a, b) => {
        const keyA = `${a.systemId}::${a.termEn.toLowerCase()}`;
        const keyB = `${b.systemId}::${b.termEn.toLowerCase()}`;
        const countDiff = (usageCount.get(keyA) || 0) - (usageCount.get(keyB) || 0);
        if (countDiff !== 0) return countDiff;
        const aWasLast = prevTerm && a.termEn.toLowerCase() === prevTerm ? 1 : 0;
        const bWasLast = prevTerm && b.termEn.toLowerCase() === prevTerm ? 1 : 0;
        return aWasLast - bWasLast;
      });

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

    saveSessionToFirebase(session);
    setActiveSession(session);
    setView('summary');
  };

  const nextUntestedStudent = useMemo(() => {
    if (roster.length === 0) return null;
    return (
      roster.find(
        (stu) =>
          !history.some(
            (h) =>
              (stu.studentId && h.studentId === stu.studentId) ||
              (stu.studentName && h.studentName === stu.studentName) ||
              (stu.seatNumber && h.seatNumber === stu.seatNumber)
          )
      ) || null
    );
  }, [history, roster]);

  const handleStartNextStudent = () => {
    if (nextUntestedStudent) {
      setConfig((prev) => ({
        ...prev,
        seatNumber: nextUntestedStudent.seatNumber,
        studentId: nextUntestedStudent.studentId,
        studentName: nextUntestedStudent.studentName,
      }));
    } else {
      const prevSeatNum = parseInt(config.seatNumber.trim(), 10);
      const nextSeat = Number.isFinite(prevSeatNum) ? String(prevSeatNum + 1) : '';
      setConfig((prev) => ({
        ...prev,
        studentName: '',
        studentId: '',
        seatNumber: nextSeat,
      }));
    }
    setView('setup');
  };

  const handleImmediateNextExam = () => {
    if (!nextUntestedStudent) {
      handleStartNextStudent();
      return;
    }
    const nextCfg: ExamConfig = {
      ...config,
      seatNumber: nextUntestedStudent.seatNumber,
      studentId: nextUntestedStudent.studentId,
      studentName: nextUntestedStudent.studentName,
    };
    setConfig(nextCfg);
    startExamWithConfig(nextCfg);
  };

  const handleAddCustomTerm = (term: AnatomyTerm) => {
    saveTermToFirebase(term);
  };

  const handleDeleteCustomTerm = (id: string) => {
    deleteTermFromFirebase(id);
  };

  const handleQuickUploadForSystem = (systemId: SystemId, imageUrl: string) => {
    setEditingPlate(null);
    setBuilderDefaultSystemId(systemId);
    setBuilderQuickImageUrl(imageUrl);
    setBuilderOpen(true);
  };

  const handleSaveCustomPlate = (plate: CustomPlate) => {
    savePlateToFirebase(plate);
    setConfig((prev) => ({
      ...prev,
      selectedCustomPlateIds: prev.selectedCustomPlateIds.includes(plate.id)
        ? prev.selectedCustomPlateIds
        : [...prev.selectedCustomPlateIds, plate.id],
    }));
    setBuilderOpen(false);
    setEditingPlate(null);
    setBuilderQuickImageUrl('');
  };

  const handleDeleteCustomPlate = (id: string) => {
    deletePlateFromFirebase(id);
    setConfig((prev) => ({
      ...prev,
      selectedCustomPlateIds: prev.selectedCustomPlateIds.filter((pid) => pid !== id),
    }));
  };

  const handleDeleteSession = (id: string) => {
    deleteSessionFromFirebase(id);
  };

  const handleClearAllHistory = () => {
    clearHistoryInFirebase(history);
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

    const targetSession =
      (activeSession && activeSession.id === sessionId
        ? activeSession
        : history.find((h) => h.id === sessionId)) || null;

    if (targetSession) {
      void saveSessionToFirebase(updateRecord(targetSession));
    }
    setActiveSession((prev) => (prev ? updateRecord(prev) : prev));
  };

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 ${
      active
        ? 'text-sky-700 border-sky-600 font-semibold'
        : 'text-slate-600 border-transparent hover:text-sky-700'
    }`;

  const canQuickStart = buildExamPool(config).length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-atlas-grid text-slate-900">

      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 shadow-sm">
        <div className="max-w-[1320px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setView('setup')}
            className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-slate-900 truncate shrink min-w-0 cursor-pointer"
          >
            วิชา กายวิภาคศาสตร์
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

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 justify-end">
                <Cloud className="w-3 h-3" />
                SHARED
              </p>
              <p className="text-[10px] font-medium text-slate-500">
                Real-time
              </p>
            </div>

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
                className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                เริ่มสอบทันที
              </button>
            )}
          </div>
          </div>
        </div>

        {/* Mobile Nav Strip */}
        <div className="flex md:hidden items-center justify-around border-t border-slate-100 px-3 py-2 bg-white">
          <button
            type="button"
            onClick={() => setView('setup')}
            className={`text-xs font-medium px-2 py-1 ${
              view === 'setup' ? 'text-sky-600 font-semibold' : 'text-slate-600'
            }`}
          >
            จัดชุดสอบ
          </button>
          <button
            type="button"
            onClick={() => setView('library')}
            className={`text-xs font-medium px-2 py-1 ${
              view === 'library' ? 'text-sky-600 font-semibold' : 'text-slate-600'
            }`}
          >
            คลังคำศัพท์ 8 ระบบ
          </button>
          <button
            type="button"
            onClick={() => setView('history')}
            className={`text-xs font-medium px-2 py-1 ${
              view === 'history' ? 'text-sky-600 font-semibold' : 'text-slate-600'
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
            examDescription={examDescription}
            onChangeExamDescription={updateExamDescriptionInFirebase}
            onChangeConfig={setConfig}
            onStartExam={() => startExamWithConfig(config)}
            onOpenLibrary={() => setView('library')}
            onQuickUploadForSystem={handleQuickUploadForSystem}
            onOpenCustomPlateBuilder={(plate, sysId) => {
              setEditingPlate(plate || null);
              setBuilderQuickImageUrl('');
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
            nextUntestedStudent={nextUntestedStudent}
            testedCount={history.length}
            totalRosterCount={roster.length}
            onStartNextStudent={handleStartNextStudent}
            onImmediateNextExam={handleImmediateNextExam}
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
          initialImageUrl={builderQuickImageUrl}
          onSave={handleSaveCustomPlate}
          onClose={() => {
            setBuilderOpen(false);
            setEditingPlate(null);
            setBuilderQuickImageUrl('');
          }}
        />
      )}

      {/* Student Roster Modal */}
      {rosterOpen && (
        <RosterModal
          roster={roster}
          onAddEntry={saveRosterEntryToFirebase}
          onAddBatch={saveRosterToFirebase}
          onDeleteEntry={deleteRosterEntryFromFirebase}
          onClearAll={() => clearRosterInFirebase(roster)}
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
