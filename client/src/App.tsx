import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Interceptor from './pages/Interceptor';
import Analyzer from './pages/Analyzer';
import Compliance from './pages/Compliance';
import Audit from './pages/Audit';
import AuditChat from './pages/AuditChat';



import { DomainProvider } from './context/DomainContext';
import { ReportProvider } from './context/ReportContext';

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <DomainProvider>
      <ReportProvider>
        <div className={`min-h-screen flex ${isLanding ? 'bg-black text-white' : 'bg-neutral-950 text-neutral-50'}`}>
          {!isLanding && <Sidebar />}
        <div className="flex-1 flex flex-col h-screen">
          <main className={`flex-1 overflow-y-auto w-full ${!isLanding ? 'p-8' : ''}`}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/interceptor" element={<Interceptor />} />
              <Route path="/analyzer" element={<Analyzer />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/audit-chat" element={<AuditChat />} />
            </Routes>
          </main>
        </div>
        </div>
      </ReportProvider>
    </DomainProvider>
  );
}
