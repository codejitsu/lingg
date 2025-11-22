import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'highlight'
    fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            fullWidth = false,
            className = '',
            children,
            ...props
        },
        ref,
    ) => {
        const baseStyles =
            'inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

        const variantStyles = {
            primary:
                'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600',
            secondary:
                'bg-white text-primary-700 border-2 border-primary-600 hover:bg-primary-50 focus:ring-primary-500 dark:bg-gray-800 dark:text-primary-400 dark:border-primary-500 dark:hover:bg-gray-700',
            ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800',
            highlight:
                'bg-fuchsia-200 text-white hover:bg-fuchsia-700 focus:ring-fuchsia-500 dark:bg-fuchsia-600 dark:hover:bg-fuchsia-600',
        }

        const widthStyles = fullWidth ? 'w-full' : ''

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variantStyles[variant]} ${widthStyles} ${className}`}
                {...props}
            >
                {children}
            </button>
        )
    },
)

Button.displayName = 'Button'
