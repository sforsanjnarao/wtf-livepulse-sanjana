import React, { useState } from 'react';
import { GymProvider } from './store/GymContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { Anomalies } from './pages/Anomalies';
import { useWebSocket } from './hooks/useWebSocket';
import { useGymData } from './hooks/useGymData';

type Page = 'dashboard' | 'analytics' | 'anomalies';

// Inner component so hooks have access to context
function AppInner() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  // Bootstrap hooks
  useWebSocket();
  useGymData();

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'analytics' && <Analytics />}
      {currentPage === 'anomalies' && <Anomalies />}
    </Layout>
  );
}

function App() {
  return (
    <GymProvider>
      <AppInner />
    </GymProvider>
  );
}

export default App;
