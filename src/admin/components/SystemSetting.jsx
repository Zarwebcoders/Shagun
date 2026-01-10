"use client"
import { Settings, Save } from "lucide-react"

export default function SystemSettings() {
    return (
        <div className="space-y-8 animate-fadeIn text-white">
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
            `}</style>
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        System Settings
                    </h2>
                    <p className="text-gray-400 mt-1 flex items-center gap-2">
                        <Settings className="w-4 h-4 text-teal-500" />
                        Configure platform global settings
                    </p>
                </div>
            </div>

            <div className="p-8 text-center text-gray-500 border border-teal-500/20 rounded-xl bg-[#0f0f1a]/50">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>System settings configuration coming soon...</p>
            </div>
        </div>
    )
}
