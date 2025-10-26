'use client'

import * as React from 'react'
import {
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
} from '@/components/ui/sidebar'

import type { StoryInterface } from '@/models/Story.Interface'
import type { BucketsInterface } from '@/models/history/Buckets.Interface'
import { HistoryPoint } from '@/models/history/HistoryPoint.Interface'
import { Star } from 'lucide-react'

function HistoryLinks({
    stories,
    newStoryId,
    currentStoryId,
    hidden,
}: React.ComponentProps<typeof SidebarContent> & {
    stories: StoryInterface[]
    newStoryId?: string
    currentStoryId?: string
    hidden: boolean
}) {
    const buckets: BucketsInterface = {
        today: { period: HistoryPoint.TODAY, stories: [] },
        yesterday: { period: HistoryPoint.YESTERDAY, stories: [] },
        last7days: { period: HistoryPoint.LAST_7_DAYS, stories: [] },
        lastMonth: { period: HistoryPoint.LAST_MONTH, stories: [] },
        everythingElse: { period: HistoryPoint.EVERYTHING_ELSE, stories: [] },
    }

    const now = new Date()

    for (const story of stories) {
        const startedAt = new Date(story.startedAt)
        const diffTime = Math.abs(now.getTime() - startedAt.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 0) {
            buckets.today.stories.push(story)
        } else if (diffDays === 1) {
            buckets.yesterday.stories.push(story)
        } else if (diffDays <= 7) {
            buckets.last7days.stories.push(story)
        } else if (diffDays <= 30) {
            buckets.lastMonth.stories.push(story)
        } else {
            buckets.everythingElse.stories.push(story)
        }
    }

    const conversationHistory = [
        buckets.today,
        buckets.yesterday,
        buckets.last7days,
        buckets.lastMonth,
        buckets.everythingElse,
    ].filter((bucket) => bucket.stories.length > 0)

    return (
        <SidebarContent className="pt-2 relative overflow-hidden bg-gradient-to-br from-white via-white to-white/20 dark:from-gray-900 dark:via-gray-900 dark:to-primary-900/20">
            {conversationHistory.map((group) => (
                <SidebarGroup key={group.period}>
                    <SidebarGroupLabel className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {group.period}
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {group.stories.slice(0, 5).map((story) => (
                            <SidebarMenuButton
                                key={story.storyId}
                                className={`text-sm font-medium text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors ${story.storyId === currentStoryId ? 'border-l-4 rounded-none border-l-primary-600 dark:border-l-primary-400' : ''}`}
                            >
                                <a href={`/#/story/${story.storyId}`}>
                                    {story.title}
                                </a>
                                {story.storyId === newStoryId && !hidden && (
                                    <Star size={24} color="#22c55e" fill="#22c55e" />
                                )}
                            </SidebarMenuButton>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </SidebarContent>
    )
}

export default HistoryLinks
