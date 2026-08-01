import * as React from "react"
import { cn } from "@/src/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          {
            'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] border-0': variant === 'default',
            'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90': variant === 'destructive',
            'border border-slate-700 bg-slate-800/50 text-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:bg-slate-700': variant === 'outline',
            'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80': variant === 'secondary',
            'hover:bg-slate-800 text-slate-400 hover:text-white': variant === 'ghost',
            'text-cyan-400 underline-offset-4 hover:underline': variant === 'link',
            'h-12 px-6 py-2': size === 'default',
            'h-10 rounded-xl px-4 text-[10px]': size === 'sm',
            'h-14 rounded-2xl px-8': size === 'lg',
            'h-12 w-12': size === 'icon',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
