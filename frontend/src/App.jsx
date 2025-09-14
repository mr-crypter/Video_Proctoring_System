import React, { useEffect, useState } from 'react';
import './App.css';
import './output.css';
import { Button } from './components/ui/button.jsx';
import InterviewScreen from './components/InterviewScreen.jsx';
import Report from './components/Report.jsx';
import { createCandidate } from './services/api.js';

export default function App() {
  const [candidateId, setCandidateId] = useState(localStorage.getItem('candidateId') || '');
  const [view, setView] = useState('interview'); // 'interview' | 'report'

  useEffect(() => {
    const ensureCandidate = async () => {
      if (!candidateId) {
        try {
          const res = await createCandidate('Interviewee');
          if (res && res.candidateId) {
            localStorage.setItem('candidateId', res.candidateId);
            setCandidateId(res.candidateId);
          }
        } catch (e) {
          console.error(e);
        }
      }
    };
    ensureCandidate();
  }, [candidateId]);

  if (!candidateId) return <div className="App min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 flex items-center justify-center">Initializing interview...</div>;

  return (
    <div className="App min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="mb-4 flex gap-2">
          <Button variant={view==='interview' ? 'default' : 'secondary'} onClick={() => setView('interview')}>Interview</Button>
          <Button variant={view==='report' ? 'default' : 'secondary'} onClick={() => setView('report')}>Report</Button>
        </div>
      {view === 'interview' ? (
        <InterviewScreen candidateId={candidateId} onCompleted={() => setView('report')} />
      ) : (
        <Report candidateId={candidateId} onBack={() => setView('interview')} />
      )}
      </div>
    </div>
  );
}


