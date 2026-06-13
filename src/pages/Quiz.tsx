import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { mockQuestions, mockFlashcards } from '../mockData';

export default function Quiz() {
  const [activeTab, setActiveTab] = useState<'hub' | 'simulados' | 'flashcards' | 'performance'>('hub');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dbQuestions, setDbQuestions] = useState<any[]>([]);
  const [dbFlashcards, setDbFlashcards] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data: qData } = await supabase.from('questions').select('*');
      const { data: fData } = await supabase.from('flashcards').select('*');
      setDbQuestions(qData || mockQuestions);
      setDbFlashcards(fData || mockFlashcards);
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans">
      {/* Sidebar Lateral */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 shadow-xl`}>
        <div className="p-8">
          <div className="text-blue-600 font-black text-xl mb-10 flex items-center gap-2">
            <span>🩺</span> PRESIDÊNCIA VET
          </div>
          <nav className="space-y-3">
            {[
              { id: 'hub', label: 'Dashboard', icon: '🏠' },
              { id: 'simulados', label: 'Simulados', icon: '📝' },
              { id: 'flashcards', label: 'Flashcards', icon: '⚡' },
              { id: 'performance', label: 'Métricas', icon: '📊' }
            ].map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <span className="text-xl">{item.icon}</span> {item.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full">
        <header className="p-4 md:p-8 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <button className="md:hidden p-2 text-xl" onClick={() => setIsSidebarOpen(true)}>☰</button>
          <h2 className="text-xl font-black text-slate-800 dark:text-white capitalize">{activeTab}</h2>
          <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200" />
        </header>

        <div className="p-4 md:p-8 max-w-5xl mx-auto">
          {activeTab === 'hub' && (
            <div className="space-y-8">
              <section>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Olá, Doutor!</h1>
                <p className="text-slate-500">Pronto para continuar sua jornada de estudos hoje?</p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg">
                  <span className="text-4xl mb-4 block">📝</span>
                  <h3 className="text-xl font-bold mb-1">Simulados</h3>
                  <p className="text-blue-100 opacity-90">{dbQuestions.length} questões disponíveis</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-4xl mb-4 block">⚡</span>
                  <h3 className="text-xl font-bold mb-1 text-slate-800 dark:text-white">Flashcards</h3>
                  <p className="text-slate-500">{dbFlashcards.length} cartões prontos</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}