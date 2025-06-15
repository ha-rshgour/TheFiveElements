import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { theme } from './theme'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UserManagement from './pages/UserManagement'
import { useAuthStore } from './stores/authStore'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}

export default App 