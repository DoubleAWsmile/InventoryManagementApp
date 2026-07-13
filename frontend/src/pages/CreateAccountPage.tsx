import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Map,
  Package,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { Logo } from "../components/TopNav";
import { createUser } from "../services/api";

export interface CreateAccountPageProps {
  onFinished: () => void;
  onBackToSignIn: () => void;
}

export default function CreateAccountPage({ onFinished, onBackToSignIn }: CreateAccountPageProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [wantsUpdates, setWantsUpdates] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim()) {
      setError("Please enter your name and email to create your account.");
      return;
    }
    if (!emailValid) {
      setError("That doesn't look like a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await createUser(email.trim(), fullName.trim(), password.trim());
      onFinished();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "We couldn't create your account yet. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const features = [
    { Icon: Package, label: "Start with essentials", desc: "Add rooms, items, quantities, and values." },
    { Icon: Map, label: "Organize by location", desc: "Keep every record tied to where it lives." },
    { Icon: ShieldCheck, label: "Keep records ready", desc: "Build useful documentation from day one." },
  ];

  return (
    <div className="min-h-screen flex bg-background" style={{ fontFamily: "'Figtree', sans-serif" }}>
      <div
        className="hidden lg:flex flex-col w-[520px] xl:w-[580px] flex-shrink-0 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1C3557 0%, #0F2240 100%)" }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 580 900"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <circle cx="500" cy="120" r="300" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <circle cx="500" cy="120" r="220" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <circle cx="500" cy="120" r="140" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <circle cx="80" cy="780" r="260" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          <circle cx="80" cy="780" r="180" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <ellipse cx="290" cy="460" rx="320" ry="200" fill="rgba(63,95,224,0.08)" />
          {Array.from({ length: 12 }).map((_, row) =>
            Array.from({ length: 8 }).map((_, col) => (
              <circle
                key={`d-${row}-${col}`}
                cx={col * 72 + 24}
                cy={row * 76 + 40}
                r="1.5"
                fill="rgba(255,255,255,0.06)"
              />
            ))
          )}
        </svg>

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 border border-white/10">
              <Layers size={17} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              Home<span style={{ color: "#7B9EFF" }}>Vault</span>
            </span>
          </div>

          <div className="mt-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-6">
              <Sparkles size={11} className="text-blue-300" />
              <span className="text-[11px] font-medium text-blue-200 tracking-wide">
                Your inventory starts here
              </span>
            </div>
            <h2
              className="text-[40px] xl:text-[46px] font-bold text-white leading-[1.1] mb-5"
              style={{ letterSpacing: "-0.04em", fontFamily: "'Instrument Serif', serif" }}
            >
              Build a clearer view
              <br />
              <span style={{ color: "#7B9EFF" }}>of your home.</span>
            </h2>
            <p className="text-base text-white/60 leading-relaxed max-w-sm">
              Create a HomeVault account and start shaping your household inventory.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/8 border border-white/10 flex-shrink-0">
                  <f.Icon size={15} className="text-blue-300" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90">{f.label}</div>
                  <div className="text-xs text-white/45 mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-white/10">
            <div className="flex items-start gap-3">
              <CheckCircle2 size={18} className="text-blue-300 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/50 leading-relaxed">
                Account creation is mocked for now, so finishing will return you to sign in.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-[420px]">
          <div className="flex items-center justify-between mb-10">
            <div className="lg:hidden">
              <Logo />
            </div>
            <button
              type="button"
              onClick={onBackToSignIn}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={15} />
              Sign in
            </button>
          </div>

          <div className="mb-8">
            <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center mb-4">
              <UserPlus size={20} />
            </div>
            <h1
              className="text-[30px] font-bold text-foreground leading-tight mb-1.5"
              style={{ letterSpacing: "-0.035em", fontFamily: "'Instrument Serif', serif" }}
            >
              Create account
            </h1>
            <p className="text-sm text-muted-foreground">
              Set up your HomeVault account.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 mb-5">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-snug">{error}</p>
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0 text-lg leading-none"
              >
                x
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Sarah Chen"
                autoComplete="name"
                className={[
                  "w-full h-11 px-4 rounded-xl border text-sm text-foreground bg-card placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all",
                  error && !fullName.trim() ? "border-red-300 bg-red-50/30" : "border-border focus:border-accent/50",
                ].join(" ")}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@example.com"
                autoComplete="email"
                className={[
                  "w-full h-11 px-4 rounded-xl border text-sm text-foreground bg-card placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all",
                  error && !email.trim() ? "border-red-300 bg-red-50/30" : "border-border focus:border-accent/50",
                ].join(" ")}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  className={[
                    "w-full h-11 px-4 pr-11 rounded-xl border text-sm text-foreground bg-card placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all",
                    error && !password.trim() ? "border-red-300 bg-red-50/30" : "border-border focus:border-accent/50",
                  ].join(" ")}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                Confirm password
              </label>
              <input
                type={showPw ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                className={[
                  "w-full h-11 px-4 rounded-xl border text-sm text-foreground bg-card placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all",
                  error && !confirmPassword.trim() ? "border-red-300 bg-red-50/30" : "border-border focus:border-accent/50",
                ].join(" ")}
              />
            </div>

            <div className="flex items-start gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={wantsUpdates}
                onClick={() => setWantsUpdates((v) => !v)}
                className={[
                  "rounded border-2 flex items-center justify-center flex-shrink-0 transition-all mt-0.5",
                  wantsUpdates ? "bg-accent border-accent" : "bg-card border-border hover:border-accent/50",
                ].join(" ")}
                style={{ width: "18px", height: "18px" }}
              >
                {wantsUpdates && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span
                className="text-sm text-muted-foreground select-none cursor-pointer leading-snug"
                onClick={() => setWantsUpdates((v) => !v)}
              >
                Send me product updates and inventory tips.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-accent text-accent-foreground text-sm font-semibold flex items-center justify-center gap-2.5 hover:bg-accent/90 active:scale-[0.99] transition-all shadow-sm disabled:opacity-80 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                "Finish"
              )}
            </button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onBackToSignIn}
              className="text-accent font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
