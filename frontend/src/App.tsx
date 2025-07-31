import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/pages/Dashboard'
import { Chat } from '@/pages/Chat'
import { ExcelUpload } from '@/pages/ExcelUpload'
import { Expenses } from '@/pages/Expenses'
import { Settings } from '@/pages/Settings'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { AuthProvider } from '@/hooks/useAuth'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* 인증 관련 라우트 (레이아웃 없음) */}
          <Route path="/login" element={
            <ProtectedRoute>
              <Login />
            </ProtectedRoute>
          } />
          <Route path="/register" element={
            <ProtectedRoute>
              <Register />
            </ProtectedRoute>
          } />

          {/* 메인 레이아웃을 사용하는 보호된 라우트들 */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="chat" element={<Chat />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="excel" element={<ExcelUpload />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* 404 페이지 */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App