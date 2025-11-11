import type { ReactNode } from 'react'

interface FeatureCardProps {
    icon: ReactNode
    title: string
    description: string
}

export const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
    return (
        <div className="relative p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">{description}</p>
        </div>
    )
}
