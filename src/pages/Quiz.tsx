import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { mockQuestions, mockFlashcards } from '../mockData';

// Interface padronizada
interface Question { id: string; category: string; text: string; type: string; options: string[]; correctAnswer: string; }
interface Flashcard { id: string; category: string; front: string; back: string; }

export default function Quiz() {
  const [activeTab, setActiveTab] = useState<'hub' | 'simulados' | 'flashcards' | 'performance'>('hub');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dbQuestions, setDbQuestions] = useState<Question[]>([]);
  const [dbFlashcards, setDbFlashcards] = useState<Flashcard[]>([]);

  // Carregamento de dados com tratamento de erro
  useEffect(() => {
    async function loadData() {
      const { data: qData } = await supabase.from('questions').select('*');
      const { data: fData } = await supabase.from('flashcards').select('*');
      
      setDbQuestions(qData?.length ? (qData as any) : mockQuestions);
      setDbFlashcards(fData?.length ? (fData as any) : mockFlashcards);
    }
    loadData();
  }, []);

  // Re-injetando o seu layout original dentro da estrutura de Sidebar
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex font-sans">
      
      {/* Sidebar Lateral */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6">
          <h1 className="font-black text-blue-600 mb-8 tracking-tight">PRESIDÊNCIA VET</h1>
          <nav className="space-y-2">
            {[
              { id: 'hub', label: 'Início', icon: '🏠' },
              { id: 'simulados', label: 'Simulados', icon: '📝' },
              { id: 'flashcards', label: 'Flashcards', icon: '⚡' },
              { id: 'performance', label: 'Métricas', icon: '📊' }
            ].map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold ${activeTab === item.id ? 'bg-blue-50 text-blue-600 dark:bg-slate-800' : 'text-slate-500'}`}>
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
        <button className="md:hidden p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm mb-6 border dark:border-slate-800" onClick={() => setIsSidebarOpen(true)}>
          ☰ Menu
        </button>

        <div className="max-w-5xl mx-auto">
          {activeTab === 'hub' && (
            <div className="space-y-6">
              <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">Bem-vindo, Doutor(a)</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg mb-2">Simulados Disponíveis</h3>
                    <p className="text-slate-500">{dbQuestions.length} questões prontas para estudo.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg mb-2">Flashcards</h3>
                    <p className="text-slate-500">{dbFlashcards.length} flashcards carregados.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Adicione aqui abaixo os outros estados das abas se precisar de mais conteúdo */}
          <div className="mt-10 text-slate-400 text-center">
            {activeTab !== 'hub' && <p>Conteúdo da aba {activeTab} em exibição...</p>}
          </div>
        </div>
      </main>
    </div>
  );
}