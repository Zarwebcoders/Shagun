"use client"

import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Layout from "./components/Layout"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"
import Packages from "./pages/Packages"
import KYC from "./pages/KYC"
import Shopping from "./pages/Shopping"
import Withdrawal from "./pages/Withdrawal"
import Downline from "./pages/Downline"
import ReferralIncome from "./pages/ReferralIncome"
import LevelIncome from "./pages/LevelIncome"
import Profile from "./pages/Profile"
import TransactionHistory from "./pages/TransactionHistory"
import Home from "./components/Home"
import AdminLayout from "./admin/page"
import UserManagement from "./admin/components/UserManagement"
import KYCApprovals from "./admin/components/KYCApprovals"
import WithdrawalRequests from "./admin/components/WidthrawalRequest"
import PackageManagement from "./admin/components/PackageManagement"
import TransactionMonitor from "./admin/components/TransactionMonitor"
import Reports from "./admin/components/Reports"
import SystemSettings from "./admin/components/SystemSetting"
import AdminDashboard from "./admin/components/AdminDashboard"

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Single Login Route for both User and Admin */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : 
          isAdminAuthenticated ? <Navigate to="/admin/dashboard" /> :
            <Login
              setIsAuthenticated={setIsAuthenticated}
              setIsAdminAuthenticated={setIsAdminAuthenticated}
            />
        } />

        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/dashboard" /> :
            <Signup setIsAuthenticated={setIsAuthenticated} />
        } />

        {/* User Protected Routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
          } />
          <Route path="/packages" element={
            isAuthenticated ? <Packages /> : <Navigate to="/login" />
          } />
          <Route path="/kyc" element={
            isAuthenticated ? <KYC /> : <Navigate to="/login" />
          } />
          <Route path="/withdrawal" element={
            isAuthenticated ? <Withdrawal /> : <Navigate to="/login" />
          } />
          <Route path="/downline" element={
            isAuthenticated ? <Downline /> : <Navigate to="/login" />
          } />
          <Route path="/referral-income" element={
            isAuthenticated ? <ReferralIncome /> : <Navigate to="/login" />
          } />
          <Route path="/level-income" element={
            isAuthenticated ? <LevelIncome /> : <Navigate to="/login" />
          } />
          <Route path="/profile" element={
            isAuthenticated ? <Profile /> : <Navigate to="/login" />
          } />
          <Route path="/transactions" element={
            isAuthenticated ? <TransactionHistory /> : <Navigate to="/login" />
          } />
        </Route>

        {/* Admin Protected Routes - Fixed Structure */}
        <Route path="/admin" element={
          isAdminAuthenticated ? <AdminLayout /> : <Navigate to="/login" />
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="kyc-approvals" element={<KYCApprovals />} />
          <Route path="withdrawals" element={<WithdrawalRequests />} />
          <Route path="packages" element={<PackageManagement />} />
          <Route path="transactions" element={<TransactionMonitor />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}