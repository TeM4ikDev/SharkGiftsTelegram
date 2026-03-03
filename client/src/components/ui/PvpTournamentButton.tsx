import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PvpTournamentButtonProps {
    to?: string;
    text?: string;
    className?: string;
}

export const PvpTournamentButton: React.FC<PvpTournamentButtonProps> = ({
    to = "/leaderboard",
    text = "ПвП Турнир",
    className = "",
}) => {
    const navigate = useNavigate();

    return (
        <button
            type="button"
            onClick={() => navigate(to)}
            className={`relative overflow-hidden w-full rounded-2xl px-4 py-2 bg-gradient-to-r from-fuchsia-600 via-pink-700 to-violet-600 text-black shadow-[0_8px_24px_rgba(217,70,239,0.35)] active:scale-[0.99] transition-transform ${className}`}
        >
            <motion.span
                className="pointer-events-none absolute inset-0 opacity-35 bg-[radial-gradient(circle_at_16%_38%,rgba(255,255,255,0.5)_0px,rgba(255,255,255,0)_18%),radial-gradient(circle_at_78%_28%,rgba(255,255,255,0.45)_0px,rgba(255,255,255,0)_16%),radial-gradient(circle_at_62%_74%,rgba(255,255,255,0.35)_0px,rgba(255,255,255,0)_20%)]"
                animate={{ opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
                className="pointer-events-none absolute top-1.5 left-6 text-white/85 text-[10px]"
                animate={{ opacity: [0.45, 1, 0.45], scale: [0.9, 1.15, 0.9] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
            >
                ✦
            </motion.span>
            <motion.span
                className="pointer-events-none absolute top-1/2 right-20 -translate-y-1/2 text-white/75 text-[11px]"
                animate={{ opacity: [0.35, 0.9, 0.35], scale: [0.85, 1.1, 0.85] }}
                transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut", delay: 0.35 }}
            >
                ✧
            </motion.span>
            <motion.span
                className="pointer-events-none absolute bottom-1.5 right-8 text-white/70 text-[9px]"
                animate={{ opacity: [0.3, 0.85, 0.3], scale: [0.8, 1.08, 0.8] }}
                transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
            >
                ✦
            </motion.span>

            <span className="relative z-10 flex items-center justify-center gap-2 text-white font-extrabold text-lg leading-none">
                {text}
                <ChevronRight className="w-5 h-5" />
            </span>
        </button>
    );
};
