import { LogIn, Clock, Shield, Zap } from "lucide-react";
import { motion } from "motion/react";

interface AuthProps {
  onLogin: () => void;
}

export function Auth({ onLogin }: AuthProps) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full" />
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-emerald-500 rounded-2xl mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/20"
          >
            <Clock className="w-10 h-10 text-black" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tighter text-white">CHRONOS AI</h1>
            <p className="text-zinc-400 text-lg">The Time-Bound Execution Engine</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-xl space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-zinc-800 rounded-lg">
                <Shield className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100">Immutable Mode</h3>
                <p className="text-sm text-zinc-500">Once started, the clock never stops. Real-time accountability.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-zinc-800 rounded-lg">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-100">Autonomous Scheduling</h3>
                <p className="text-sm text-zinc-500">AI-driven subject rotation and task prioritization.</p>
              </div>
            </div>
          </div>

          <button
            onClick={onLogin}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
          
          <p className="text-center text-xs text-zinc-600">
            By signing in, you agree to our terms of service and the immutable time-bound execution rules.
          </p>
        </div>
      </div>
    </div>
  );
}
