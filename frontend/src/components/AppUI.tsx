import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../app/components/ui/utils";

type Size = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "violet";

const buttonSizes: Record<Size, string> = {
  sm: "h-7 gap-1.5 rounded-lg px-3 text-[11px]",
  md: "h-9 gap-2 rounded-lg px-4 text-sm",
  lg: "h-10 gap-2 rounded-xl px-5 text-sm",
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-foreground hover:bg-accent/90",
  secondary: "border border-border bg-card text-foreground hover:bg-muted",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
};

const toneStyles: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  info: "bg-blue-50 text-blue-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  danger: "bg-red-50 text-red-600",
  violet: "bg-violet-50 text-violet-600",
};

interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: Size;
  Icon?: LucideIcon;
}

export function AppButton({
  variant = "secondary",
  size = "md",
  Icon,
  className,
  children,
  ...props
}: AppButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50",
        buttonSizes[size],
        buttonVariants[variant],
        className,
      )}
      {...props}
    >
      {Icon && <Icon size={size === "sm" ? 11 : 14} />}
      {children}
    </button>
  );
}

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | Size;
  interactive?: boolean;
}

const surfacePadding = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

export function Surface({ padding = "md", interactive, className, ...props }: SurfaceProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-sm",
        interactive && "transition-shadow hover:shadow-md",
        surfacePadding[padding],
        className,
      )}
      {...props}
    />
  );
}

interface IconTileProps {
  Icon: LucideIcon;
  tone?: Tone;
  size?: Size;
  className?: string;
}

const iconSizes: Record<Size, string> = {
  sm: "h-7 w-7 rounded-lg",
  md: "h-9 w-9 rounded-xl",
  lg: "h-10 w-10 rounded-xl",
};

export function IconTile({ Icon, tone = "neutral", size = "md", className }: IconTileProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        iconSizes[size],
        toneStyles[tone],
        className,
      )}
    >
      <Icon size={size === "sm" ? 13 : 16} />
    </div>
  );
}

interface FormFieldProps {
  label: string;
  optional?: boolean;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, optional, required, children, className }: FormFieldProps) {
  return (
    <label className={cn("block text-xs font-semibold", className)}>
      <span className="mb-1.5 block">
        {label} {required && <span className="text-red-400">*</span>}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </span>
      {children}
    </label>
  );
}

export const controlClass = cn(
  "w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground",
  "focus:outline-none focus:ring-2 focus:ring-accent/25",
);

export function AppInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, "h-10", className)} {...props} />;
}

interface FeedbackBannerProps {
  tone: "success" | "danger";
  children: ReactNode;
}

export function FeedbackBanner({ tone, children }: FeedbackBannerProps) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm font-semibold",
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700",
      )}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{children}</p>;
}
