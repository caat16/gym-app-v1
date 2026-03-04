import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomeDashboard from './pages/HomeDashboard';
import Plans from './pages/Plans';
import Classes from './pages/Classes';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes directly handled inside AppLayout mostly via HomeDashboard */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomeDashboard />} />
          <Route path="classes" element={<Classes />} />
          <Route path="plans" element={<Plans />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
