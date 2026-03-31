import { useState } from "react";
import { LogIn, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";

interface AuthProps {
  onLogin: () => Promise<unknown>;
}

const Sunrays = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none origin-center transition-all">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="relative w-full h-full flex items-center justify-center"
      >
        {[...Array(24)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ 
              opacity: [0, 0.8, 0.4],
              scale: [0.9, 1.4, 1.1],
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              repeatType: "reverse",
              delay: i * 0.15,
              ease: "easeInOut"
            }}
            style={{ rotate: `${i * (360 / 24)}deg` }}
            className="absolute w-[4px] h-[600px] bg-gradient-to-t from-transparent via-[#da7756]/60 to-transparent blur-[2px]"
          />
        ))}
      </motion.div>
      {/* Intense Central Glows */}
      <div className="absolute w-64 h-64 bg-[#da7756]/30 blur-[60px] rounded-full" />
      <div className="absolute w-32 h-32 bg-[#da7756]/40 blur-[30px] rounded-full" />
      <div className="absolute w-16 h-16 bg-[#da7756]/60 blur-[15px] rounded-full" />
    </div>
  );
};

export function Auth({ onLogin }: AuthProps) {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setError(null);
      await onLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("auth/unauthorized-domain")) {
        setError("Google sign-in is blocked for this host. Add localhost to Firebase Authentication authorized domains.");
      } else {
        setError("Sign-in failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden relative font-serif">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#da7756]/5 blur-[120px] rounded-full" />
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-24 h-24">
            <Sunrays />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 3, ease: "easeOut" }}
              className="relative w-24 h-24 border border-[#da7756] flex items-center justify-center bg-black overflow-hidden shadow-2xl shadow-[#da7756]/20 z-10"
            >
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </motion.div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-normal uppercase text-foreground font-serif">KARYADARSHANA</h1>
            <p className="text-muted text-lg font-serif">Systematic Project & Task Management</p>
          </div>
        </div>

        <div className="bg-card border border-border p-8 rounded-none backdrop-blur-xl space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-background rounded-none border border-border">
                <Shield className="w-5 h-5 text-[#da7756]" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Immutable Execution</h3>
                <p className="text-sm text-muted font-serif">A formal registry for high-stakes projects and deadlines.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-background rounded-none border border-border">
                <Zap className="w-5 h-5 text-[#da7756]" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100">Multi-Dashboard Sync</h3>
                <p className="text-sm text-zinc-500 font-serif">Isolated engines for placement, research, and core tasks.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-none transition-all active:scale-[0.98]"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
          
          {error && <p className="text-sm text-red-400 text-center font-serif">{error}</p>}
          
          <p className="text-center text-xs text-zinc-600 font-serif">
            By signing in, you acknowledge the Karyadarshana project management protocols.
          </p>
        </div>
      </div>
    </div>
  );
}
