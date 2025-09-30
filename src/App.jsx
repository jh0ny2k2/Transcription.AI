import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'
import TranscriptionHistoryPage from './components/TranscriptionHistoryPage'
import UserProfilePage from './components/UserProfilePage'
import NewTranscriptionPage from './components/NewTranscriptionPage'
import TranscriptionViewPage from './components/TranscriptionViewPage'
import Login from './components/Login'
import Register from './components/Register'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/history" 
              element={
                <ProtectedRoute>
                  <TranscriptionHistoryPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/profile" 
              element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/new" 
              element={
                <ProtectedRoute>
                  <NewTranscriptionPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/transcription/:id" 
              element={
                <ProtectedRoute>
                  <TranscriptionViewPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/home" 
              element={<Navigate to="/dashboard" replace />} 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
