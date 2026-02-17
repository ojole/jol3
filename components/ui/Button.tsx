import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'font-semibold rounded transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  const variantStyles = {
    primary: 'btn-primary',
    secondary: 'bg-white border-2 border-[var(--color-border-dark)] text-[var(--color-text-primary)] hover:bg-[var(--color-paper-dark)]',
    ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-icon-hover)]',
  }

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
