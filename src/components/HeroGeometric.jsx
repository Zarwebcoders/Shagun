import { motion } from "framer-motion";

export default function HeroGeometric() {
    return (
        <div className="relative w-full h-[400px] md:h-[500px] flex items-center justify-center perspective-1000">
            {/* Main Rotating Structure */}
            <motion.div
                className="relative w-48 h-48 md:w-64 md:h-64 preserve-3d"
                animate={{ rotateX: 360, rotateY: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* Core Sphere */}
                <div className="absolute inset-0 rounded-full bg-violet-600/20 blur-xl"></div>

                {/* Outer Rings */}
                {[0, 60, 120].map((deg, i) => (
                    <div
                        key={i}
                        className="absolute inset-0 rounded-full border border-violet-400/30"
                        style={{ transform: `rotateY(${deg}deg)` }}
                    ></div>
                ))}

                {[0, 60, 120].map((deg, i) => (
                    <div
                        key={i}
                        className="absolute inset-0 rounded-full border border-indigo-400/30"
                        style={{ transform: `rotateX(${deg}deg)` }}
                    ></div>
                ))}

                {/* Floating Particles */}
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full"
                />
            </motion.div>

            {/* Glowing Backdrop */}
            <div className="absolute inset-0 bg-gradient-radial from-violet-600/20 to-transparent blur-3xl pointer-events-none" />
        </div>
    );
}
