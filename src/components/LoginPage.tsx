import { useState } from "react";
import {
  Eye, EyeOff, AlertCircle, Loader2, Layers, Package, Map, ShieldCheck, Sparkles,
} from "lucide-react";
import { Logo } from "./TopNav";

export interface LoginPageProps {
  onSuccess: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password to continue.");
      return;
    }
    if (!emailValid) {
      setError("That doesn't look like a valid email address.");
      return;
    }
    if (password.length < 4) {
      setError("Invalid email or password. Please try again.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess();
    }, 1600);
  }

  const features = [
    { Icon: Package, label: "Track everything you own", desc: "Items, quantities, values, and locations." },
    { Icon: Map, label: "Map your home", desc: "Visualize where every item lives, room by room." },
    { Icon: ShieldCheck, label: "Insurance-ready records", desc: "Estimated values and receipts in one place." },
  ];

  return (
    <div className="min-h-screen flex bg-background" style={{ fontFamily: "'Figtree', sans-serif" }}>

      {/* ── Left branding panel ─────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col w-[520px] xl:w-[580px] flex-shrink-0 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1C3557 0%, #0F2240 100%)" }}
      >
        {/* Background geometry */}
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
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/10 border border-white/10">
              <Layers size={17} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              Home<span style={{ color: "#7B9EFF" }}>Vault</span>
            </span>
          </div>

          {/* Hero text */}
          <div className="mt-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 mb-6">
              <Sparkles size={11} className="text-blue-300" />
              <span className="text-[11px] font-medium text-blue-200 tracking-wide">
                Home inventory, simplified
              </span>
            </div>
            <h2
              className="text-[40px] xl:text-[46px] font-bold text-white leading-[1.1] mb-5"
              style={{ letterSpacing: "-0.04em", fontFamily: "'Instrument Serif', serif" }}
            >
              Everything you own,
              <br />
              <span style={{ color: "#7B9EFF" }}>perfectly organized.</span>
            </h2>
            <p className="text-base text-white/60 leading-relaxed max-w-sm">
              Keep track of your items, rooms, and household inventory in one beautiful place.
            </p>
          </div>

          {/* Features */}
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

          {/* Testimonial */}
          <div className="mt-10 pt-8 border-t border-white/10">
            <p className="text-sm text-white/50 italic leading-relaxed">
              "HomeVault helped me catalog 300+ items in an afternoon. Best thing I did before our home insurance renewal."
            </p>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                <span className="text-[11px] font-bold text-white">MR</span>
              </div>
              <div>
                <div className="text-[12px] font-semibold text-white/70">Marcus R.</div>
                <div className="text-[11px] text-white/35">HomeVault user since 2023</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <Logo />
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-[30px] font-bold text-foreground leading-tight mb-1.5"
              style={{ letterSpacing: "-0.035em", fontFamily: "'Instrument Serif', serif" }}
            >
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your home inventory.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 mb-5">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-snug">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600 flex-shrink-0 text-lg leading-none"
              >
                ×
              </button>
            </div>
          )}

          {/* Google SSO */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium text-foreground shadow-sm mb-5"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4"/>
              <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
              <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4069 3.78409 7.83 3.96409 7.29V4.9582H0.957275C0.347727 6.1731 0 7.5477 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
              <path d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9259L15.0218 2.3445C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9582L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
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

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-foreground">Password</label>
                <button type="button" className="text-xs text-accent font-medium hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
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

            {/* Remember me */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={remember}
                onClick={() => setRemember((v) => !v)}
                className={[
                  "rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                  remember ? "bg-accent border-accent" : "bg-card border-border hover:border-accent/50",
                ].join(" ")}
                style={{ width: "18px", height: "18px" }}
              >
                {remember && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span
                className="text-sm text-muted-foreground select-none cursor-pointer"
                onClick={() => setRemember((v) => !v)}
              >
                Remember me for 30 days
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-accent text-accent-foreground text-sm font-semibold flex items-center justify-center gap-2.5 hover:bg-accent/90 active:scale-[0.99] transition-all shadow-sm disabled:opacity-80 disabled:cursor-not-allowed mt-1"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Create account */}
          <p className="text-sm text-center text-muted-foreground mt-6">
            {"Don't have an account? "}
            <button className="text-accent font-semibold hover:underline">Create Account</button>
          </p>

          {/* Legal */}
          <p className="text-[11px] text-center text-muted-foreground/60 mt-8 leading-relaxed">
            By signing in, you agree to HomeVault's{" "}
            <button className="underline underline-offset-2 hover:text-muted-foreground">Terms of Service</button>
            {" and "}
            <button className="underline underline-offset-2 hover:text-muted-foreground">Privacy Policy</button>.
          </p>
        </div>
      </div>
    </div>
  );
}
