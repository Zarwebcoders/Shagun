"use client"

import AdminLayout from "./components/AdminLayout"
import AdminDashboard from "./components/adminDashboard"

export default function AdminPage() {
    return (
        <AdminLayout>
            <AdminDashboard />
        </AdminLayout>
    )
}
