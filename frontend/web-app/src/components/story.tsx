'use client'

import {
    ChatContainerContent,
    ChatContainerRoot,
} from '@/components/prompt-kit/chat-container'
import {
    Message,
    MessageAvatar,
    MessageContent,
} from '@/components/prompt-kit/message'
import { Button } from '@/components/ui/button'
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarProvider,
} from '@/components/ui/sidebar'
import {
    PlusIcon,
    Search,
} from 'lucide-react'
import { Markdown } from "@/components/prompt-kit/markdown"
import { useState } from 'react'

import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react'

// TODO - replace with real user ID from auth context
const userId = 'f257727e-94ab-44ac-aa0e-c4d51a0d67ac'

// GraphQL query to list all stories for a user
const LIST_ALL_STORIES = gql`
    query ListAllStories {
        listStories(userId: "${userId}") {
            explainLanguage
            startedAt
            storyId
            storyType
            targetLanguage
            title
            userId
        }
    }
`

type Story = {
    startedAt: string;
    storyId: string;
    title: string;
};

type Period = {
    period: string;
    stories: Story[];
};

type Buckets = {
    today: Period;
    yesterday: Period;
    last7days: Period;
    lastMonth: Period;
    everythingElse: Period;
};

function ChatSidebar() {
    const { loading, error, data } = useQuery<{ listStories: Story[] }>(LIST_ALL_STORIES)

    if (error) return <p>Error loading stories: {error.message}</p>
    if (loading) return <p>Loading stories...</p>

    const buckets: Buckets = {
        today: { period: 'Today', stories: [] },
        yesterday: { period: 'Yesterday', stories: [] },
        last7days: { period: 'Last 7 days', stories: [] },
        lastMonth: { period: 'Last month', stories: [] },
        everythingElse: { period: 'Older than a month', stories: [] },
    };

    const now = new Date();

    for (const story of data?.listStories || []) {
        const startedAt = new Date(story.startedAt);
        const diffTime = Math.abs(now.getTime() - startedAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            buckets.today.stories.push(story);
        } else if (diffDays === 1) {
            buckets.yesterday.stories.push(story);
        } else if (diffDays <= 7) {
            buckets.last7days.stories.push(story);
        } else if (diffDays <= 30) {
            buckets.lastMonth.stories.push(story);
        } else {
            buckets.everythingElse.stories.push(story);
        }
    }

    const conversationHistory = [buckets.today, buckets.yesterday, buckets.last7days, 
        buckets.lastMonth, buckets.everythingElse].filter(bucket => bucket.stories.length > 0);

    return (
        <Sidebar>
            <SidebarHeader className="flex flex-row items-center justify-between gap-2 px-2 py-4">
                <div className="flex flex-row items-center gap-2 px-2">
                    <div className="bg-primary/10 size-8 rounded-md"></div>
                    <div className="text-md font-base text-primary tracking-tight">
                        lingg.ai
                    </div>
                </div>
                <Button variant="ghost" className="size-8">
                    <Search className="size-4" />
                </Button>
            </SidebarHeader>
            <SidebarContent className="pt-4">
                {conversationHistory.map((group) => (
                    <SidebarGroup key={group.period}>
                        <SidebarGroupLabel>{group.period}</SidebarGroupLabel>
                        <SidebarMenu>
                            {group.stories.map((story) => (
                                <SidebarMenuButton key={story.storyId} className="text-muted-foreground">
                                    <span>{story.title}</span>
                                </SidebarMenuButton>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </SidebarContent>
        </Sidebar>
    )
}

function ChatContent() {
    const [messages, setMessages] = useState([
        {
        id: 1,
        role: "user",
        content: "Hello! Can you help me with a coding question?",
        },
        {
        id: 2,
        role: "assistant",
        content:
            "Of course! I'd be happy to help with your coding question. What would you like to know?",
        },
        {
        id: 3,
        role: "user",
        content: "How do I create a responsive layout with CSS Grid?",
        },
        {
        id: 4,
        role: "assistant",
        content:
            "Creating a responsive layout with CSS Grid is straightforward. Here's a basic example:\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 1rem;\n}\n```\n\nThis creates a grid where:\n- Columns automatically fit as many as possible\n- Each column is at least 250px wide\n- Columns expand to fill available space\n- There's a 1rem gap between items\n\nWould you like me to explain more about how this works?",
        },
    ])

    const addMessage = () => {
        // Add a new message
        setMessages([
        ...messages,
        {
            id: messages.length + 1,
            role:
            messages[messages.length - 1].role === "user" ? "assistant" : "user",
            content:
            messages[messages.length - 1].role === "user"
                ? "That's a great question! Let me explain further. CSS Grid is a powerful layout system that allows for two-dimensional layouts. The `minmax()` function is particularly useful as it sets a minimum and maximum size for grid tracks."
                : "Thanks for the explanation! Could you tell me more about grid areas?",
        },
        ])
    }

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b p-3">
            <div />
            <div className="flex items-center gap-2">
            <Button size="sm" onClick={addMessage}>
                <PlusIcon className="size-4" />
                <span>New Story</span>
            </Button>
            </div>
        </div>

        <ChatContainerRoot className="flex-1">
            <ChatContainerContent className="space-y-4 p-4">
            {messages.map((message) => {
                const isAssistant = message.role === "assistant"

                return (
                <Message
                    key={message.id}
                    className={
                    message.role === "user" ? "justify-end" : "justify-start"
                    }
                >
                    {isAssistant && (
                    <MessageAvatar
                        src="/avatars/ai.png"
                        alt="AI Assistant"
                        fallback="AI"
                    />
                    )}
                    <div className="max-w-[85%] flex-1 sm:max-w-[75%]">
                    {isAssistant ? (
                        <div className="text-left bg-secondary text-foreground prose rounded-lg p-2">
                        <Markdown>{message.content}</Markdown>
                        </div>
                    ) : (
                        <MessageContent className="text-left bg-gray-700 text-primary-foreground">
                        {message.content}
                        </MessageContent>
                    )}
                    </div>
                </Message>
                )
            })}
            </ChatContainerContent>
        </ChatContainerRoot>
        </div>
    )
}

function FullChatApp() {
    return (
        <SidebarProvider>
            <ChatSidebar />
            <SidebarInset>
                <ChatContent />
            </SidebarInset>
        </SidebarProvider>
    )
}

export { FullChatApp }
