import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Interceptor from './pages/Interceptor';
import Analyzer from './pages/Analyzer';
import Compliance from './pages/Compliance';
import FairWatch from './pages/FairWatch';
import Audit from './pages/Audit';
import { DomainProvider } from './context/DomainContext';

export default function App() {
  return (
    <DomainProvider>
      <div className="min-h-screen bg-neutral-950 text-neutral-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen">
          <main className="flex-1 p-8 overflow-y-auto w-full">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/interceptor" element={<Interceptor />} />
              <Route path="/analyzer" element={<Analyzer />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/fairwatch" element={<FairWatch />} />
              <Route path="/audit" element={<Audit />} />
            </Routes>
          </main>
        </div>
      </div>
    </DomainProvider>
  );
}
