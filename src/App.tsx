import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomeDashboard from './pages/HomeDashboard';
import Plans from './pages/Plans';
import Classes from './pages/Classes';
import Login from './pages/Login';
import Register from './pages/Register';
import { useGymStore } from './store/useStore';

function App() {
  const { fetchInitialData, loading } = useGymStore();
  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    fetchInitialData().then(() => setIsInit(true));
  }, [fetchInitialData]);

  if (!isInit || loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#39ff14]"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes directly handled inside AppLayout mostly via HomeDashboard */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<HomeDashboard />} />
          <Route path="classes" element={<Classes />} />
          <Route path="plans" element={<Plans />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
