import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { mockQuestions, mockFlashcards } from '../mockData';

// Interface
interface Question { id: string; category: string; text: string; type: string; options: string[]; correctAnswer: string; }
interface Flashcard { id: string; category: string; front: string; back: string; }

export default function Quiz() {
  const [activeTab, setActiveTab] = useState<'hub' | 'simulados' | 'flashcards' | 'performance'>('hub');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dbQuestions, setDbQuestions] = useState<Question[]>([]);
  const [dbFlashcards, setDbFlashcards] = useState<Flashcard[]>([]);

  // Este useEffect utiliza as importações (supabase, mockQuestions, mockFlashcards)
  // Portanto, o TypeScript não deve mais reclamar.
  useEffect(() => {
    async function initData() {
      try {
        // Tenta Supabase
        const { data: qData } = await supabase.from('questions').select('*');
        if (qData) setDbQuestions(qData as any);
        else setDbQuestions(mockQuestions as any); // Fallback usando mock

        const { data: fData } = await supabase.from('flashcards').select('*');
        if (fData) setDbFlashcards(fData as any);
        else setDbFlashcards(mockFlashcards as any); // Fallback usando mock
      } catch (err) {
        console.error("Erro ao carregar, usando mocks", err);
        setDbQuestions(mockQuestions as any);
        setDbFlashcards(mockFlashcards as any);
      }
    }
    initData();
  }, []); // A dependência vazia é correta aqui

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6">
          <h1 className="font-black text-blue-600 mb-8 text-xl">PRESIDÊNCIA VET</h1>
          <nav className="space-y-2">
            {[ 
              { id: 'hub', label: 'Início', icon: '🏠' },
              { id: 'simulados', label: 'Simulados', icon: '📝' },
              { id: 'flashcards', label: 'Flashcards', icon: '⚡' },
              { id: 'performance', label: 'Métricas', icon: '📊' }
            ].map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-colors ${activeTab === item.id ? 'bg-blue-50 text-blue-600 dark:bg-slate-800' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Overlay mobile */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 w-full p-4 md:p-8">
        <button className="md:hidden p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm mb-4 border dark:border-slate-800" onClick={() => setIsSidebarOpen(true)}>
          ☰ Menu
        </button>
        
        <div className="max-w-4xl mx-auto w-full">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4 capitalize">{activeTab}</h2>
            {/* Aqui entra o seu conteúdo de cada aba */}
            <p className="text-slate-500">Conteúdo da aba {activeTab} (Carregando {dbQuestions.length} questões e {dbFlashcards.length} flashcards)...</p>
        </div>
      </main>
    </div>
  );
}