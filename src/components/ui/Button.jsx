'use client'

const variants = {
  primary:
    'bg-executive-dark text-white hover:bg-executive-deeper shadow-md transition-all duration-300 hover:shadow-lg',
  accent:
    'bg-executive-accent text-executive-dark hover:bg-executive-accent-dark shadow-md transition-all duration-300',
  outline:
    'border-2 border-executive-dark text-executive-dark hover:bg-executive-dark hover:text-white bg-white',
  ghost: 'text-executive-dark hover:bg-executive-border/40',
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  href,
  onClick,
  type = 'button',
  disabled,
}) {
  const classes = `inline-flex min-h-12 items-center justify-center rounded-lg px-6 text-sm font-bold tracking-wide uppercase ${variants[variant]} ${className}`

  if (href) {
    return (
      <a href={href} onClick={onClick} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${classes} ${disabled ? 'opacity-70' : ''}`}
    >
      {children}
    </button>
  )
}
