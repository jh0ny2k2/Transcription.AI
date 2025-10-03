import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'
import TranscriptionHistoryPage from './components/TranscriptionHistoryPage'
import UserProfilePage from './components/UserProfilePage'
import NewTranscriptionPage from './components/NewTranscriptionPage'
import TranscriptionViewPage from './components/TranscriptionViewPage'
import SubscriptionPlans from './components/SubscriptionPlans'
import CheckoutPage from './components/CheckoutPage'
import UsageDisplay from './components/UsageDisplay'
import ImageTextExtractor from './components/ImageTextExtractor'
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
              path="/dashboard/subscription" 
              element={
                <ProtectedRoute>
                  <SubscriptionPlans />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/checkout" 
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/usage" 
              element={
                <ProtectedRoute>
                  <UsageDisplay />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/ocr" 
              element={
                <ProtectedRoute>
                  <ImageTextExtractor />
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
