import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { mockQuestions, mockFlashcards } from '../mockData';

export default function Quiz() {
  const [activeTab, setActiveTab] = useState<'hub' | 'simulados' | 'flashcards' | 'performance'>('hub');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Usamos 'any' aqui para aceitar qualquer formato vindo do Supabase sem quebrar o TypeScript
  const [dbQuestions, setDbQuestions] = useState<any[]>([]);
  const [dbFlashcards, setDbFlashcards] = useState<any[]>([]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    async function fetchDatabase() {
      setLoading(true);
      try {
        const { data: qData } = await supabase.from('questions').select('*');
        const { data: fData } = await supabase.from('flashcards').select('*');
        
        const finalQuestions = (qData && qData.length > 0) ? qData : mockQuestions;
        const finalFlashcards = (fData && fData.length > 0) ? fData : mockFlashcards;
        
        setDbQuestions(finalQuestions);
        setDbFlashcards(finalFlashcards);
      } catch (error) {
        console.error("Erro no Supabase. Injetando mockData de segurança:", error);
        setDbQuestions(mockQuestions);
        setDbFlashcards(mockFlashcards);
      } finally {
        setLoading(false);
      }
    }
    fetchDatabase();
  }, []);

  // 1. FUNÇÃO BLINDADA: Busca a resposta correta independente de como a coluna se chama no banco
  const extractCorrectAnswer = (questionObject: any): string => {
    return String(
      questionObject.correctAnswer || 
      questionObject.correct_answer || 
      questionObject.resposta_correta || 
      questionObject.resposta || 
      questionObject.answer || 
      ""
    );
  };

  // 2. FUNÇÃO BLINDADA: Valida a resposta considerando espaços, maiúsculas e letras (A, B, C)
  const checkIsCorrect = (option: string, correctString: string, optionIndex: number) => {
    if (!option || !correctString) return false;
    
    const optClean = String(option).trim().toLowerCase();
    const corrClean = String(correctString).trim().toLowerCase();
    
    if (optClean === corrClean) return true;
    
    const letters = ['a', 'b', 'c', 'd', 'e'];
    if (corrClean === letters[optionIndex]) return true;
    
    if (optClean.startsWith(corrClean + ')') || optClean.startsWith(corrClean + '-')) return true;
    if (optClean.includes(corrClean) && corrClean.length > 3) return true;

    return false;
  };

  const handleAnswerClick = (option: string, index: number) => {
    if (selectedAnswer !== null) return; 
    setSelectedAnswer(option);
    
    const actualCorrectAnswer = extractCorrectAnswer(dbQuestions[currentQuestionIndex]);
    const isCorrect = checkIsCorrect(option, actualCorrectAnswer, index);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < dbQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer(null);
  };

  const handleNextFlashcard = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentFlashcardIndex((prev) => (prev + 1) % dbFlashcards.length), 200);
  };

  const handlePrevFlashcard = () => {
    setIsFlipped(false);
    setTimeout(() => setCurrentFlashcardIndex((prev) => (prev - 1 + dbFlashcards.length) % dbFlashcards.length), 200);
  };

  const renderHub = () => (
    <div className="space-y-10 animate-fade-in max-w-5xl">
      <header className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Sua Jornada <span className="text-blue-600">Veterinária</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl font-medium">
          Continue sua preparação para a residência com foco total.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div onClick={() => setActiveTab('simulados')} className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500/30 transition-all duration-300 cursor-pointer overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">📝</div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Simulados Clínicos</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{dbQuestions.length} questões carregadas</p>
            <div className="flex items-center text-blue-600 font-bold group-hover:translate-x-2 transition-transform">Começar agora <span className="ml-2">→</span></div>
          </div>
        </div>

        <div onClick={() => setActiveTab('flashcards')} className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300 cursor-pointer overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">⚡</div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Flashcards</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">{dbFlashcards.length} cartões carregados</p>
            <div className="flex items-center text-indigo-600 font-bold group-hover:translate-x-2 transition-transform">Revisar agora <span className="ml-2">→</span></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSimulado = () => {
    if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 font-medium animate-pulse">Analisando banco de questões...</div>;
    if (dbQuestions.length === 0) return <div className="text-center text-slate-500 py-20">Nenhuma questão encontrada.</div>;

    if (showResult) {
      const percentage = Math.round((score / dbQuestions.length) * 100);
      return (
        <div className="bg-white dark:bg-slate-900 p-10 md:p-16 rounded-[2rem] text-center shadow-lg border border-slate-100 dark:border-slate-800 max-w-2xl mx-auto animate-fade-in">
          <div className="w-32 h-32 mx-auto bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-8">
            <span className="text-6xl">{percentage >= 70 ? '🎉' : '💪'}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white mb-4">Desempenho</h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">
            Você acertou <span className="text-blue-600 font-black text-2xl mx-1">{score}</span> de <span className="font-bold text-slate-700 dark:text-slate-300">{dbQuestions.length}</span> questões ({percentage}%).
          </p>
          <button onClick={restartQuiz} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 active:scale-95 font-bold py-4 px-10 rounded-2xl transition-all w-full md:w-auto shadow-xl shadow-slate-900/20">
            Realizar Novo Simulado
          </button>
        </div>
      );
    }

    const question = dbQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / dbQuestions.length) * 100;
    const letters = ['A', 'B', 'C', 'D', 'E'];
    
    // Extrai a resposta correta usando a função blindada
    const actualCorrectAnswer = extractCorrectAnswer(question);

    return (
      <div className="max-w-3xl mx-auto animate-fade-in w-full">
        <div className="mb-10">
          <div className="flex justify-between text-sm font-bold text-slate-400 mb-3">
            <span>Questão {currentQuestionIndex + 1} de {dbQuestions.length}</span>
            <span className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-lg uppercase tracking-wider text-xs">{question.category || "Geral"}</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-10 leading-snug">
          {question.text}
        </h2>

        <div className="space-y-4 mb-10">
          {question.options && Array.isArray(question.options) ? question.options.map((option: string, idx: number) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = checkIsCorrect(option, actualCorrectAnswer, idx);
            const hasAnswered = selectedAnswer !== null;
            
            let btnClass = "w-full text-left p-5 md:p-6 rounded-2xl border-2 font-medium text-base md:text-lg transition-all duration-200 flex items-start gap-4 ";
            let letterClass = "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ";

            if (!hasAnswered) {
              btnClass += "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 cursor-pointer active:scale-[0.99]";
              letterClass += "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600";
            } else if (isCorrect) {
              btnClass += "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-800 dark:text-emerald-300 shadow-sm";
              letterClass += "bg-emerald-500 text-white";
            } else if (isSelected && !isCorrect) {
              btnClass += "border-rose-500 bg-rose-50/50 dark:bg-rose-900/10 text-rose-800 dark:text-rose-300";
              letterClass += "bg-rose-500 text-white";
            } else {
              btnClass += "border-slate-100 dark:border-slate-800/50 opacity-40 bg-transparent text-slate-500";
              letterClass += "bg-slate-100 dark:bg-slate-800 text-slate-400";
            }

            return (
              <button key={idx} disabled={hasAnswered} onClick={() => handleAnswerClick(option, idx)} className={`group ${btnClass}`}>
                <div className={letterClass}>{letters[idx] || '-'}</div>
                <div className="mt-0.5 leading-relaxed">{option}</div>
              </button>
            );
          }) : <div className="text-rose-500">Erro: Alternativas não encontradas no formato correto.</div>}
        </div>

        {selectedAnswer && (
          <div className="flex justify-end animate-fade-in">
            <button onClick={handleNextQuestion} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-xl transition-all active:scale-95 shadow-lg flex items-center gap-2">
              Continuar <span>→</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderFlashcards = () => {
    if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 font-medium animate-pulse">Carregando baralhos de retenção...</div>;
    if (dbFlashcards.length === 0) return <div className="text-center text-slate-500 py-20">Nenhum flashcard disponível no momento.</div>;

    const card = dbFlashcards[currentFlashcardIndex];

    return (
      <div className="max-w-2xl mx-auto flex flex-col items-center animate-fade-in w-full">
        <div className="w-full flex justify-between items-center mb-8 px-2">
          <span className="text-sm font-bold text-slate-400">
            Card {currentFlashcardIndex + 1} de {dbFlashcards.length}
          </span>
          <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
            {card.category || "Geral"}
          </span>
        </div>

        <div className="relative w-full aspect-[4/3] md:aspect-[3/2] cursor-pointer group" style={{ perspective: '1000px' }} onClick={() => setIsFlipped(!isFlipped)}>
          <div className="w-full h-full relative transition-transform duration-500 ease-out shadow-2xl rounded-[2rem]" style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
            <div className="absolute inset-0 w-full h-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 md:p-12 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: 'hidden' }}>
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-2xl mb-6 shadow-inner">🤔</div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white leading-snug">{card.front}</h3>
              <p className="absolute bottom-8 text-slate-400 text-sm font-medium animate-pulse mt-4">Toque para revelar a resposta</p>
            </div>

            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 md:p-12 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl mb-6 shadow-inner text-white">💡</div>
              <p className="text-2xl md:text-3xl font-medium leading-relaxed text-white">{card.back}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-12">
          <button onClick={handlePrevFlashcard} className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-90"><span className="text-2xl">&larr;</span></button>
          <button onClick={handleNextFlashcard} className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center hover:bg-indigo-700 transition-colors active:scale-90"><span className="text-2xl">&rarr;</span></button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafcff] dark:bg-[#0b1120] flex font-sans selection:bg-blue-200">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800 transition-transform duration-300 ease-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-2xl md:shadow-none flex flex-col`}>
        <div className="p-8">
          <div className="text-slate-900 dark:text-white font-black text-2xl mb-12 flex items-center gap-3 tracking-tighter">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-600/20">🩺</div>
            PVET
          </div>
          <nav className="space-y-2">
            {[
              { id: 'hub', label: 'Painel Geral', icon: '🏠' },
              { id: 'simulados', label: 'Simulados', icon: '📝' },
              { id: 'flashcards', label: 'Flashcards', icon: '⚡' }
            ].map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-all duration-200 ${activeTab === item.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <span className="text-xl opacity-80">{item.icon}</span> {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 md:hidden transition-opacity" onClick={() => setIsSidebarOpen(false)} />}

      <main className="flex-1 md:ml-72 w-full min-h-screen flex flex-col relative">
        <header className="p-6 md:px-10 flex items-center justify-between sticky top-0 z-30 bg-[#fafcff]/80 dark:bg-[#0b1120]/80 backdrop-blur-md">
          <button className="md:hidden p-2 text-2xl text-slate-600 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700" onClick={() => setIsSidebarOpen(true)}>
            ☰
          </button>
        </header>

        <div className="flex-1 p-6 md:p-10 w-full max-w-7xl mx-auto flex flex-col">
          {activeTab === 'hub' && renderHub()}
          {activeTab === 'simulados' && renderSimulado()}
          {activeTab === 'flashcards' && renderFlashcards()}
        </div>
      </main>
    </div>
  );
}