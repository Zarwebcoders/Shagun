"use client"

import { useEffect, useState } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import Layout from "./components/Layout"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"
import Packages from "./pages/Packages"
import KYC from "./pages/KYC"
import Shopping from "./pages/Shopping"
import Withdrawal from "./pages/Withdrawal"
import PaymentRequests from "./admin/components/PaymentRequests"
import BankDetails from "./pages/BankDetails"
import BankRequests from "./admin/components/BankRequests"
import MiningBonus from "./pages/MiningBonus"
import Downline from "./pages/Downline"
import ReferralIncome from "./pages/ReferralIncome"
import LevelIncome from "./pages/LevelIncome"
import Commissions from "./pages/Commissions"
import Profile from "./pages/Profile"
import TransactionHistory from "./pages/TransactionHistory"
import Home from "./components/Home"
import Products from "./pages/Products"
import VendorWithdrawal from "./pages/VendorWithdrawal"
import VendorWithdrawalRequests from "./admin/components/VendorWithdrawalRequests"
import VendorWallet from "./pages/VendorWallet"
import VendorWallets from "./admin/components/VendorWallets"
import VendorKYC from "./pages/VendorKYC"
import VendorKYCRequests from "./admin/components/VendorKYCRequests"
import VendorAccount from "./pages/VendorAccount"
import VendorAccounts from "./admin/components/VendorAccounts"
import VendorProfile from "./pages/VendorProfile"
import VendorList from "./admin/components/VendorList"
import TokenRateManagement from "./admin/components/TokenRateManagement"
import SystemMigrations from "./admin/components/SystemMigrations"
import ContractUpdateQueue from "./admin/components/ContractUpdateQueue"
import AdminDashboard from "./admin/components/AdminDashboard"
import AdminLayout from "./admin/components/AdminLayout"
import UserManagement from "./admin/components/UserManagement"
import KYCApprovals from "./admin/components/KYCApprovals"
import WithdrawalRequests from "./admin/components/WidthrawalRequest"
import PackageManagement from "./admin/components/PackageManagement"
import TransactionMonitor from "./admin/components/TransactionMonitor"
import SystemSettings from "./admin/components/SystemSetting"
import TokenManagement from "./admin/components/TokenManagement"
import Reports from "./admin/components/Reports"

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      const userData = JSON.parse(user)
      if (userData.role === "admin") {
        setIsAdminAuthenticated(true)
      } else {
        setIsAuthenticated(true)
      }
    }
  }, [])

  // Layout wrapper component for protected routes
  const ProtectedLayout = () => {
    return (
      <Layout setIsAuthenticated={setIsAuthenticated}>
        <Outlet />
      </Layout>
    )
  }

  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/" element={<Products />} />

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

        {/* User Protected Routes with Layout */}
        <Route element={<ProtectedLayout />}>
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
          <Route path="/vendor-withdrawal" element={
            isAuthenticated ? <VendorWithdrawal /> : <Navigate to="/login" />
          } />
          <Route path="/vendor-wallet" element={
            isAuthenticated ? <VendorWallet /> : <Navigate to="/login" />
          } />
          <Route path="/vendor-kyc" element={
            isAuthenticated ? <VendorKYC /> : <Navigate to="/login" />
          } />
          <Route path="/vendor-account" element={
            isAuthenticated ? <VendorAccount /> : <Navigate to="/login" />
          } />
          <Route path="/vendor-profile" element={
            isAuthenticated ? <VendorProfile /> : <Navigate to="/login" />
          } />
          <Route path="/downline" element={
            isAuthenticated ? <Downline /> : <Navigate to="/login" />
          } />
          <Route path="/referral-income" element={
            isAuthenticated ? <ReferralIncome /> : <Navigate to="/login" />
          } />
          <Route path="/bank-details" element={
            isAuthenticated ? <BankDetails /> : <Navigate to="/login" />
          } />
          <Route path="/level-income" element={
            isAuthenticated ? <LevelIncome /> : <Navigate to="/login" />
          } />
          <Route path="/mining-bonus" element={
            isAuthenticated ? <MiningBonus /> : <Navigate to="/login" />
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
          isAdminAuthenticated ? <AdminLayout setIsAdminAuthenticated={setIsAdminAuthenticated} /> : <Navigate to="/login" />
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="kyc-approvals" element={<KYCApprovals />} />
          <Route path="withdrawals" element={<WithdrawalRequests />} />
          <Route path="vendor-withdrawals" element={<VendorWithdrawalRequests />} />
          <Route path="vendor-wallets" element={<VendorWallets />} />
          <Route path="vendor-kyc" element={<VendorKYCRequests />} />
          <Route path="level-income" element={<LevelIncome />} />
          <Route path="commissions" element={<Commissions />} />
          <Route path="mining-bonus" element={<MiningBonus />} />
          <Route path="vendor-accounts" element={<VendorAccounts />} />
          <Route path="vendors" element={<VendorList />} />
          <Route path="token-rates" element={<TokenRateManagement />} />
          <Route path="payments" element={<PaymentRequests />} />
          <Route path="bank-requests" element={<BankRequests />} />
          <Route path="packages" element={<PackageManagement />} />
          <Route path="transactions" element={<TransactionMonitor />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="migrations" element={<SystemMigrations />} />
          <Route path="contract-queue" element={<ContractUpdateQueue />} />
          <Route path="token-management" element={<TokenManagement />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  )
}