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

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Login setIsAuthenticated={setIsAuthenticated} />
        } />
        <Route path="/signup" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Signup setIsAuthenticated={setIsAuthenticated} />
        } />
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/packages" element={<Packages />} />
                  <Route path="/kyc" element={<KYC />} />
                  {/* <Route path="/shopping" element={<Shopping />} /> */}
                  <Route path="/withdrawal" element={<Withdrawal />} />
                  <Route path="/downline" element={<Downline />} />
                  <Route path="/referral-income" element={<ReferralIncome />} />
                  <Route path="/level-income" element={<LevelIncome />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/transactions" element={<TransactionHistory />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  )
}