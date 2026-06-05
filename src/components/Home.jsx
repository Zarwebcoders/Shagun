import { useNavigate } from "react-router-dom";
import HeroSection from "./sections/HeroSection";
import CorePillars from "./sections/CorePillars";
import ProductHighlight from "./sections/ProductHighlight";
import TokenRewards from "./sections/TokenRewards";
import TimelineSection from "./sections/TimelineSection";
import CommunityShopping from "./sections/CommunityShopping";
import IncomePlan from "./sections/IncomePlan";
import FAQ from "./FAQ";


export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500 selection:text-white overflow-x-hidden font-sans">

            {/* Global Navbar (Simplified for this view) */}
            <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {/* <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">S</span>
                        </div> */}
                        {/* <span className="text-2xl font-bold text-white">ShagunPro</span> */}
                        <img src="/removedbg.png" alt="logo" className="h-16 w-16" />
                    </div>
                    <button
                        onClick={() => navigate("/login")}
                        className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium"
                    >
                        Login
                    </button>
                </div>
            </header>

            <main>
                <HeroSection navigate={navigate} />
                <CorePillars />
                <ProductHighlight />
                <TokenRewards />
                <TimelineSection />
                <CommunityShopping />
                <IncomePlan />
                <FAQ />
            </main>
        </div>
    );
}
