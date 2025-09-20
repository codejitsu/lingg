'use client'

import * as React from 'react'
import { SidebarHeader } from '@/components/ui/sidebar'

import { Bot } from 'lucide-react'

import { cn } from '@/lib/utils'

function Header({
    className,
    title,
    ...props
}: React.ComponentProps<typeof SidebarHeader>) {
    return (
        <SidebarHeader
            className={cn(
                'flex flex-row items-center justify-between gap-2 px-2 py-4',
                className,
            )}
            {...props}
        >
            <div className="flex flex-row items-center gap-2 px-2">
                <div className="bg-primary/10 size-10 rounded-md flex items-center justify-center">
                    <Bot className="size-6 text-primary" />
                </div>
                <div className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 select-none">
                    <span className="bg-gradient-to-r from-gray-700 via-gray-500 to-gray-400 bg-clip-text text-transparent">
                        <a href="/#/">{title}</a>
                    </span>
                </div>
            </div>
        </SidebarHeader>
    )
}
export default Header
