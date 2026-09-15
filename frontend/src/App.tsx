import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './lib/auth'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { BusinessPageEditorPage } from './pages/BusinessPageEditorPage'
import { DashboardPage } from './pages/DashboardPage'
import { PublicBusinessPage } from './pages/PublicBusinessPage'
import { BookingPage } from './pages/BookingPage'
import { ConfirmationPage } from './pages/ConfirmationPage'
import { NotFoundPage } from './pages/NotFoundPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastro" element={<RegisterPage />} />

              <Route
                path="/painel"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/painel/pagina"
                element={
                  <ProtectedRoute>
                    <BusinessPageEditorPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/p/:slug" element={<PublicBusinessPage />} />
              <Route path="/p/:slug/agendar/:serviceId" element={<BookingPage />} />
              <Route path="/p/:slug/confirmado" element={<ConfirmationPage />} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
