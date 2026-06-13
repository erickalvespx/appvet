import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { mockQuestions, mockFlashcards } from '../mockData';

export interface Question {
  id: string;
  category: string;
  text: string;
  type: string;
  options: string[];
  correctAnswer: string;
}

export interface Flashcard {
  id: string;
  category: string;
  front: string;
  back: string;
}

export default function Quiz() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });

  const [activeTab, setActiveTab] = useState<'hub' | 'simulados' | 'flashcards' | 'performance'>('hub');
  const [quizState, setQuizState] = useState<'selecting' | 'playing' | 'result'>('selecting');
  const [, setSelectedCategory] = useState('all');
  
  const [dbQuestions, setDbQuestions] = useState<Question[]>([]);
  const [dbFlashcards, setDbFlashcards] = useState<Flashcard[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(1);
  const [xpGainedInSession, setXpGainedInSession] = useState(0);

  const history = [
    { data: '12 Jun 2026', area: 'Clínica Geral', acertos: '8/10', porc: 80 },
    { data: '10 Jun 2026', area: 'Saúde Pública', acertos: '4/5', porc: 80 },
    { data: '08 Jun 2026', area: 'Simulado Geral', acertos: '12/20', porc: 60 }
  ];

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    async function carregarDadosDoBanco() {
      try {
        setLoading(true);
        
        // 1. Carrega e formata as questões do Supabase (evitando conflito de tipos)
        const { data: qData } = await supabase.from('questions').select('*');
        if (qData && qData.length > 0) {
          const formattedQuestions = qData.map((q: any) => ({
            id: q.id,
            category: q.category,
            text: q.text,
            type: q.type,
            options: q.options,
            correctAnswer: q.correct_answer || q.correctAnswer
          }));
          setDbQuestions(formattedQuestions);
        } else {
          setDbQuestions(mockQuestions as unknown as Question[]);
        }

        // 2. Carrega os flashcards do Supabase
        const { data: fData } = await supabase.from('flashcards').select('*');
        if (fData && fData.length > 0) {
          setDbFlashcards(fData as unknown as Flashcard[]);
        } else {
          setDbFlashcards(mockFlashcards as unknown as Flashcard[]);
        }
        
        // 3. Carrega ou inicializa as métricas do perfil
        const { data: profile } = await supabase.from('user_profiles').select('*').limit(1).maybeSingle();
        if (profile) {
          setXp(profile.xp);
          setStreak(profile.streak);
        } else {
          await supabase.from('user_profiles').insert([{ xp: 0, streak: 1 }]);
        }
      } catch (error) {
        console.error('Erro ao conectar com o Supabase, utilizando dados locais:', error);
        setDbQuestions(mockQuestions as unknown as Question[]);
        setDbFlashcards(mockFlashcards as unknown as Flashcard[]);
      } finally {
        setLoading(false);
      }
    }
    carregarDadosDoBanco();
  }, []);

  useEffect(() => {
    if (activeTab !== 'simulados' || quizState !== 'playing' || timeLeft <= 0) return;
    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finalizarSimulado(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, [activeTab, quizState, timeLeft]);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const startQuiz = (categoryId: string) => {
    const questions = categoryId === 'all' ? dbQuestions : dbQuestions.filter(q => q.category === categoryId);
    setFilteredQuestions(questions);
    setSelectedCategory(categoryId);
    setCurrentQuestionIndex(0);
    setScore(0);
    setTimeLeft(questions.length * 120);
    setSelectedOption(null);
    setIsAnswered(false);
    setQuizState('playing');
    setActiveTab('simulados');
  };

  const handleNextQuestion = () => {
    const nextIndex = currentQuestionIndex + 1;
    setSelectedOption(null);
    setIsAnswered(false);
    
    if (nextIndex < filteredQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
    } else {
      finalizarSimulado(score);
    }
  };

  const finalizarSimulado = async (acertosFinais: number) => {
    const pontosPorAcerto = 50;
    const bonusConclusao = 20;
    const totalGanho = (acertosFinais * pontosPorAcerto) + bonusConclusao;
    const novoXpTotal = xp + totalGanho;
    
    setXp(novoXpTotal);
    setXpGainedInSession(totalGanho);
    
    try {
      await supabase.from('user_profiles').update({ xp: novoXpTotal }).neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.error('Não foi possível sincronizar o XP com o servidor.', e);
    }
    setQuizState('result');
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === 'clini') return 'Clínica Médica';
    if (cat === 'saude') return 'Saúde Pública';
    if (cat === 'inspecao') return 'Inspeção de POA';
    if (cat === 'deonto') return 'Deontologia';
    return 'Geral';
  };

  const categories = [
    { id: 'all', name: 'Simulado Geral', desc: 'Questões misturadas de todas as áreas.', icon: '🎓', count: dbQuestions.length },
    { id: 'clini', name: 'Clínica Médica', desc: 'Casos clínicos e terapêutica.', icon: '🐶', count: dbQuestions.filter(q => q.category === 'clini').length },
    { id: 'saude', name: 'Saúde Pública', desc: 'Epidemiologia e zoonoses.', icon: '🔬', count: dbQuestions.filter(q => q.category === 'saude').length },
    { id: 'inspecao', name: 'Inspeção de P.O.A.', desc: 'Diretrizes do RIISPOA.', icon: '🥩', count: dbQuestions.filter(q => q.category === 'inspecao').length },
    { id: 'deonto', name: 'Deontologia e Legislação', desc: 'Código de Ética do CFMV.', icon: '📜', count: dbQuestions.filter(q => q.category === 'deonto').length }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Sincronizando com a base de dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased flex flex-col font-sans transition-colors duration-200">
      
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 px-4 transition-colors duration-200">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => { setActiveTab('hub'); setQuizState('selecting'); }}>
            <span className="text-2xl">🩺</span>
            <span className="font-black text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
              PRESIDÊNCIA VET
            </span>
          </div>
          
          <nav className="flex items-center space-x-1">
            <button 
              onClick={() => { setActiveTab('hub'); setQuizState('selecting'); }}
              className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'hub' ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Início
            </button>
            <button 
              onClick={() => setActiveTab('simulados')}
              className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'simulados' ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Simulados
            </button>
            <button 
              onClick={() => { setActiveTab('flashcards'); setIsFlipped(false); }}
              className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'flashcards' ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Flashcards
            </button>
            <button 
              onClick={() => setActiveTab('performance')}
              className={`px-3 py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'performance' ? 'bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Métricas
            </button>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-lg transition-all cursor-pointer"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-8">
        
        {activeTab === 'hub' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-white">Olá, Doutor(a)</h1>
                <p className="text-indigo-200 text-sm md:text-base max-w-md">Seu progresso está sendo computado em tempo real na nuvem!</p>
              </div>
              <div className="flex space-x-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                <div className="text-center px-2">
                  <span className="block text-xl font-bold text-amber-400">🔥 {streak} {streak === 1 ? 'Dia' : 'Dias'}</span>
                  <span className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold">Ofensiva</span>
                </div>
                <div className="w-px bg-white/20"></div>
                <div className="text-center px-2">
                  <span className="block text-xl font-bold text-emerald-400">⚡ {xp}</span>
                  <span className="text-[10px] text-indigo-200 uppercase tracking-wider font-semibold">XP Total</span>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Selecione uma Ferramenta</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div 
                onClick={() => setActiveTab('simulados')}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all shadow-sm cursor-pointer group"
              >
                <div className="text-3xl mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 w-fit rounded-xl">📝</div>
                <h3 className="font-bold text-lg mb-1 text-slate-800 dark:text-slate-100">Responder Simulados</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Testes focados por especialidade com sincronização oficial.</p>
              </div>

              <div 
                onClick={() => { setActiveTab('flashcards'); setIsFlipped(false); }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all shadow-sm cursor-pointer group"
              >
                <div className="text-3xl mb-4 p-3 bg-indigo-50 dark:bg-indigo-950/40 w-fit rounded-xl">⚡</div>
                <h3 className="font-bold text-lg mb-1 text-slate-800 dark:text-slate-100">Memorização Dinâmica</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Flashcards interativos puxados direto do servidor.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'simulados' && (
          <div className="max-w-2xl mx-auto w-full">
            {quizState === 'selecting' && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Modo Simulado</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Selecione uma categoria ativa na nuvem.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
                  {categories.map((cat) => (
                    <div 
                      key={cat.id} 
                      className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer" 
                      onClick={() => startQuiz(cat.id)}
                    >
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          <span>{cat.icon}</span> {cat.name}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cat.desc}</p>
                      </div>
                      <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm whitespace-nowrap ml-4">Iniciar ({cat.count}) →</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {quizState === 'playing' && filteredQuestions.length > 0 && (
              <div>
                <div className="mb-6 flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-sm">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block uppercase">Questão</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{currentQuestionIndex + 1} de {filteredQuestions.length}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-400 block uppercase">Tempo</span>
                    <span className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
                      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 leading-relaxed">
                    {filteredQuestions[currentQuestionIndex].text}
                  </h3>

                  <div className="space-y-3">
                    {filteredQuestions[currentQuestionIndex].options.map((option, idx) => {
                      let btnStyle = "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300";
                      if (isAnswered) {
                        if (option === filteredQuestions[currentQuestionIndex].correctAnswer) {
                          btnStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400 font-semibold";
                        } else if (option === selectedOption) {
                          btnStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-400";
                        } else {
                          btnStyle = "border-slate-100 dark:border-slate-800 opacity-50 text-slate-400 dark:text-slate-500";
                        }
                      } else if (option === selectedOption) {
                        btnStyle = "border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-medium";
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => !isAnswered && setSelectedOption(option)}
                          disabled={isAnswered}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all cursor-pointer dynamic-btn ${btnStyle}`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    {!isAnswered ? (
                      <button
                        onClick={() => { if(selectedOption) { setIsAnswered(true); if(selectedOption === filteredQuestions[currentQuestionIndex].correctAnswer) setScore(score+1); } }}
                        disabled={!selectedOption}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-all cursor-pointer shadow-sm"
                      >
                        Confirmar Resposta
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold py-3 px-6 rounded-xl transition-all cursor-pointer"
                      >
                        {currentQuestionIndex + 1 === filteredQuestions.length ? 'Finalizar' : 'Próxima'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {quizState === 'result' && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                <span className="text-5xl mb-4 block">🏆</span>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Simulado Concluído!</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Seu desempenho foi enviado para a nuvem.</p>
                
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 max-w-sm mx-auto mb-6">
                  <span className="text-emerald-800 dark:text-emerald-400 font-bold text-sm block">✨ Recompensa de Sessão</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{xpGainedInSession} XP</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl max-w-xs mx-auto mb-6 flex justify-around">
                  <div>
                    <span className="block text-2xl font-black text-blue-600 dark:text-blue-400">{Math.round((score/(filteredQuestions.length || 1))*100)}%</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Precisão</span>
                  </div>
                  <div className="w-px bg-slate-200 dark:bg-slate-700"></div>
                  <div>
                    <span className="block text-2xl font-black text-slate-800 dark:text-slate-100">{score}/{filteredQuestions.length}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500">Acertos</span>
                  </div>
                </div>
                <button onClick={() => setQuizState('selecting')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all cursor-pointer">
                  Novo Simulado
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'flashcards' && dbFlashcards.length > 0 && (
          <div className="max-w-md mx-auto w-full space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Estudo por Flashcards</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Clique sobre o cartão para revelar a resposta no verso.</p>
            </div>

            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className={`w-full min-h-[260px] bg-white dark:bg-slate-900 rounded-3xl border-2 shadow-sm p-6 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 ${isFlipped ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'}`}
            >
              <span className="text-xs uppercase tracking-wider font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full">
                {getCategoryLabel(dbFlashcards[currentCardIndex].category)}
              </span>
              
              <div className="my-auto px-4">
                {!isFlipped ? (
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{dbFlashcards[currentCardIndex].front}</p>
                ) : (
                  <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{dbFlashcards[currentCardIndex].back}</p>
                )}
              </div>

              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {!isFlipped ? '🔄 Clique para virar' : '✨ Voltar para o termo'}
              </span>
            </div>

            <div className="flex justify-between items-center px-2">
              <button 
                disabled={currentCardIndex === 0}
                onClick={(e) => { e.stopPropagation(); if(currentCardIndex > 0) { setCurrentCardIndex(currentCardIndex - 1); setIsFlipped(false); } }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                ← Anterior
              </button>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Card {currentCardIndex + 1} de {dbFlashcards.length}
              </span>
              <button 
                disabled={currentCardIndex + 1 === dbFlashcards.length}
                onClick={(e) => { e.stopPropagation(); if(currentCardIndex + 1 < dbFlashcards.length) { setCurrentCardIndex(currentCardIndex + 1); setIsFlipped(false); } }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 cursor-pointer"
              >
                Próximo →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Histórico de Desempenho</h2>
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4">Data</th>
                    <th className="p-4">Área Focada</th>
                    <th className="p-4 text-center">Acertos</th>
                    <th className="p-4 text-right">Aproveitamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {history.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 text-slate-500 dark:text-slate-400">{item.data}</td>
                      <td className="p-4 font-bold text-slate-800 dark:text-slate-100">{item.area}</td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-400">{item.acertos}</td>
                      <td className="p-4 text-right">
                        <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400">
                          {item.porc}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}