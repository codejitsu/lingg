'use client'

import {
    ChatContainerContent,
    ChatContainerRoot,
} from '@/components/prompt-kit/chat-container'
import {
    Message,
    MessageAction,
    MessageActions,
    MessageContent,
} from '@/components/prompt-kit/message'
import {
    PromptInput,
    PromptInputActions,
} from '@/components/prompt-kit/prompt-input'
import { ScrollButton } from '@/components/prompt-kit/scroll-button'
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
    SidebarTrigger,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import {
    ArrowUp,
    BookMarked,
    Bot,
    Copy,
    Languages,
    MessageCircleQuestionMark,
    Pencil,
    ThumbsDown,
    ThumbsUp,
    Trash,
} from 'lucide-react'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Loader } from '@/components/prompt-kit/loader'
import { useRef, useState, useEffect } from 'react'

import { gql } from '@apollo/client'
import { useQuery, useMutation } from '@apollo/client/react'
import { v4 as uuidv4 } from 'uuid'
import { MessageTemplate } from '@/components/message-template';

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

// GraphQL mutation to start a new story
const START_STORY = gql`
    mutation StartStory(
        $userId: ID!
        $clientRequestId: ID!
        $targetLanguage: LanguageName!
        $explainLanguage: LanguageName!
        $storyType: StoryType!
    ) {
        startStory(
            args: {
                userId: $userId
                clientRequestId: $clientRequestId
                targetLanguage: $targetLanguage
                explainLanguage: $explainLanguage
                storyType: $storyType
            }
        ) {
            explainLanguage
            startedAt
            storyId
            storyType
            targetLanguage
            title
            userId
            chapters {
                chapterId
                content
                createdAt
                storyId
                template
                placeholders {
                    name
                    text
                }
            }
        }
    }
`

type Story = {
    startedAt: string
    storyId: string
    title: string
}

type Period = {
    period: string
    stories: Story[]
}

type Buckets = {
    today: Period
    yesterday: Period
    last7days: Period
    lastMonth: Period
    everythingElse: Period
}

const messages = [
    {
        id: 1,
        role: 'user',
        content: 'Hello! Can you help me with a coding question?',
        template: 'Hello! Can you help me with a cod{ph-1} question?',
    },
    {
        id: 2,
        role: 'assistant',
        content:
            "Of course! I'd be happy to help with your coding question. What would you like to know?",
        template:
            "Of course! I'd be happy to help with your cod{ph-1} que{ph-2}ion. What would you like to know?",            
    },
    {
        id: 3,
        role: 'user',
        content: 'How do I create a responsive layout with CSS Grid?',
        template: 'How do I create a responsive layout with CSS Grid?',
    },
    {
        id: 4,
        role: 'assistant',
        content:
            "Creating a responsive layout with CSS Grid is straightforward. Here's a basic example:\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 1rem;\n}\n```\n\nThis creates a grid where:\n- Columns automatically fit as many as possible\n- Each column is at least 250px wide\n- Columns expand to fill available space\n- There's a 1rem gap between items\n\nWould you like me to explain more about how this works?",
        template:
            "Creating a responsive layout with CSS Grid is straightforward. Here's a basic example:\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 1rem;\n}\n```\n\nThis creates a grid where:\n- Columns automatically fit as many as possible\n- Each column is at least 250px wide\n- Columns expand to fill available space\n- There's a 1rem gap between items\n\nWould you like me to explain more about how this works?",
    },
]

const initialMessages: {
    id: number
    role: 'user' | 'assistant'
    content: string
    template: string
}[] = [messages[0], messages[1]]

function ChatSidebar({
    stories,
    newStoryId,
}: {
    stories: Story[]
    newStoryId?: string
}) {
    const [hidden, setHidden] = useState(false)

    useEffect(() => {
        if (newStoryId) setHidden(false)
    }, [newStoryId])

    const buckets: Buckets = {
        today: { period: 'Today', stories: [] },
        yesterday: { period: 'Yesterday', stories: [] },
        last7days: { period: 'Last 7 days', stories: [] },
        lastMonth: { period: 'Last month', stories: [] },
        everythingElse: { period: 'Older than a month', stories: [] },
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

    useEffect(() => {
        if (newStoryId) setTimeout(() => setHidden(true), 5000)
    }, [newStoryId])

    return (
        <Sidebar>
            <SidebarHeader className="flex flex-row items-center justify-between gap-2 px-2 py-4">
                <div className="flex flex-row items-center gap-2 px-2">
                    <div className="bg-primary/10 size-10 rounded-md flex items-center justify-center">
                        <Bot className="size-6 text-primary" />
                    </div>
                    <div className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-100 select-none">
                        <span className="bg-gradient-to-r from-gray-700 via-gray-500 to-gray-400 bg-clip-text text-transparent">
                            lingg.ai
                        </span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent className="pt-4">
                {conversationHistory.map((group) => (
                    <SidebarGroup key={group.period}>
                        <SidebarGroupLabel className="text-md">
                            {group.period}
                        </SidebarGroupLabel>
                        <SidebarMenu>
                            {group.stories.map((story) => (
                                <SidebarMenuButton
                                    key={story.storyId}
                                    className="text-muted-foreground flex items-center justify-between"
                                >
                                    <span>{story.title}</span>
                                    {story.storyId === newStoryId &&
                                        !hidden && (
                                            <span className="ml-2 text-xs font-semibold text-green-700 bg-green-200 rounded px-2 py-0.5 animate-pulse">
                                                New
                                            </span>
                                        )}
                                </SidebarMenuButton>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
            </SidebarContent>
        </Sidebar>
    )
}

function ChatContent({ onNewStory }: { onNewStory: (story: Story) => void }) {
    type StartStoryResult = {
        startStory: {
            storyId: string
            title: string
            startedAt: string
            chapters: { content: string, template: string }[]
        }
    }
    const [startStory] = useMutation<StartStoryResult>(START_STORY)

    const [prompt, setPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [chatMessages, setChatMessages] = useState(initialMessages)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    const [openTargetLanguage, setOpenTargetLanguage] = useState(false)
    const [valueTargetLanguage, setValueTargetLanguage] = useState('')

    const [openExplainLanguage, setOpenExplainLanguage] = useState(false)
    const [valueExplainLanguage, setValueExplainLanguage] = useState('')

    const [openStoryType, setOpenStoryType] = useState(false)
    const [valueStoryType, setValueStoryType] = useState('')

    const [isTyping, setIsTyping] = useState(false)

    const [title, setTitle] = useState('Start a new story')

    const targetLanguages = [
        {
            value: 'Ukrainian',
            label: 'Ukrainian',
        },
        {
            value: 'Russian',
            label: 'Russian',
        },
        {
            value: 'English',
            label: 'English',
        },
        {
            value: 'Spanish',
            label: 'Spanish',
        },
        {
            value: 'French',
            label: 'French',
        },
        {
            value: 'German',
            label: 'German',
        },
    ]

    const explainLanguages = [
        {
            value: 'Ukrainian',
            label: 'Ukrainian',
        },
        {
            value: 'Russian',
            label: 'Russian',
        },
        {
            value: 'English',
            label: 'English',
        },
        {
            value: 'Spanish',
            label: 'Spanish',
        },
        {
            value: 'French',
            label: 'French',
        },
        {
            value: 'German',
            label: 'German',
        },
    ]

    const storyTypes = [
        {
            value: 'BedtimeStory',
            label: 'Bed Time',
        },
        {
            value: 'Adventure',
            label: 'Adventure',
        },
        {
            value: 'SciFi',
            label: 'Sci-Fi',
        },
        {
            value: 'Fantasy',
            label: 'Fantasy',
        },
        {
            value: 'Pirates',
            label: 'Pirates',
        },
        {
            value: 'Superheroes',
            label: 'Superheroes',
        },
        {
            value: 'Animals',
            label: 'Animals',
        },
        {
            value: 'FairyTales',
            label: 'Fairy Tales',
        },
    ]

    const handleSubmit = async () => {
        if (
            !valueTargetLanguage.trim() ||
            !valueExplainLanguage.trim() ||
            !valueStoryType.trim()
        )
            return

        setIsLoading(true)
        setIsTyping(true)

        try {
            const { data } = await startStory({
                variables: {
                    userId,
                    clientRequestId: uuidv4(),
                    targetLanguage: valueTargetLanguage,
                    explainLanguage: valueExplainLanguage,
                    storyType: valueStoryType,
                },
            })

            // Optionally, you can display the story or its first chapter as a message
            if (data?.startStory?.chapters?.[0]?.template) {
                setChatMessages((prev) => [
                    ...prev,
                    {
                        id: prev.length + 1,
                        role: 'assistant',
                        content: data.startStory.chapters[0].content,
                        template: data.startStory.chapters[0].template,
                    },
                ])
            }

            // Update the title with the returned story title
            if (data?.startStory?.title) {
                setTitle(data.startStory.title)
            }

            // Add the new story to the top of the list
            if (data?.startStory) {
                onNewStory({
                    storyId: data.startStory.storyId,
                    title: data.startStory.title,
                    startedAt: data.startStory.startedAt,
                })
            }
        } catch (error: unknown) {
            let errorMessage = 'Unknown error'
            if (error instanceof Error) {
                errorMessage = error.message
            }
            setChatMessages((prev) => [
                ...prev,
                {
                    id: prev.length + 1,
                    role: 'assistant',
                    content: `Failed to start story: ${errorMessage}`,
                },
            ])
        } finally {
            setIsTyping(false)
            setIsLoading(false)
        }
    }

    return (
        <main className="flex h-[95%] w-full flex-col overflow-hidden">
            <header className="bg-background z-10 flex h-16 w-full shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <div className="text-foreground">{title}</div>
            </header>

            <div
                ref={chatContainerRef}
                className="relative flex-1 overflow-y-auto"
            >
                <ChatContainerRoot className="h-full">
                    <ChatContainerContent className="space-y-0 px-5 py-12">
                        {chatMessages.map((message, index) => {
                            const isAssistant = message.role === 'assistant'
                            const isLastMessage =
                                index === chatMessages.length - 1

                            return (
                                <Message
                                    key={message.id}
                                    className={cn(
                                        'mx-auto flex w-full max-w-3xl flex-col gap-2 px-6',
                                        isAssistant
                                            ? 'items-start'
                                            : 'items-end',
                                    )}
                                >
                                    {isAssistant ? (
                                        <div className="group flex w-full flex-col gap-0">
                                            <MessageContent
                                                className="text-secondary-foreground prose flex-1 rounded-lg bg-secondary text-left p-3"
                                            >
                                            { <MessageTemplate template={message.template} /> }
                                            </MessageContent>
                                            <MessageActions
                                                className={cn(
                                                    '-ml-2.5 flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100',
                                                    isLastMessage &&
                                                        'opacity-100',
                                                )}
                                            >
                                                <MessageAction
                                                    tooltip="Copy"
                                                    delayDuration={100}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full"
                                                    >
                                                        <Copy />
                                                    </Button>
                                                </MessageAction>
                                                <MessageAction
                                                    tooltip="Upvote"
                                                    delayDuration={100}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full"
                                                    >
                                                        <ThumbsUp />
                                                    </Button>
                                                </MessageAction>
                                                <MessageAction
                                                    tooltip="Downvote"
                                                    delayDuration={100}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full"
                                                    >
                                                        <ThumbsDown />
                                                    </Button>
                                                </MessageAction>
                                            </MessageActions>
                                        </div>
                                    ) : (
                                        <div className="group flex flex-col items-end gap-1">
                                            <MessageContent className="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 sm:max-w-[75%] text-left">
                                                {message.content}
                                            </MessageContent>
                                            <MessageActions
                                                className={cn(
                                                    'flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100',
                                                )}
                                            >
                                                <MessageAction
                                                    tooltip="Edit"
                                                    delayDuration={100}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full"
                                                    >
                                                        <Pencil />
                                                    </Button>
                                                </MessageAction>
                                                <MessageAction
                                                    tooltip="Delete"
                                                    delayDuration={100}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full"
                                                    >
                                                        <Trash />
                                                    </Button>
                                                </MessageAction>
                                                <MessageAction
                                                    tooltip="Copy"
                                                    delayDuration={100}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full"
                                                    >
                                                        <Copy />
                                                    </Button>
                                                </MessageAction>
                                            </MessageActions>
                                        </div>
                                    )}
                                </Message>
                            )
                        })}
                    </ChatContainerContent>
                    <div className="absolute bottom-4 left-1/2 flex w-full max-w-3xl -translate-x-1/2 justify-end px-5">
                        <ScrollButton className="shadow-sm" />
                    </div>
                </ChatContainerRoot>
            </div>

            <div className="bg-background z-10 shrink-0 px-3 pb-3 md:px-5 md:pb-5">
                <div className="mx-auto max-w-3xl">
                    <div className="flex flex-col items-end gap-2 p-4">
                        <Loader
                            variant="dots"
                            className={isTyping ? '' : 'hidden'}
                        />
                    </div>
                    <PromptInput
                        isLoading={isLoading}
                        value={prompt}
                        onValueChange={setPrompt}
                        onSubmit={handleSubmit}
                        className="border-input bg-popover relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs"
                    >
                        <div className="flex flex-col">
                            <PromptInputActions className="mt-3 flex w-full items-center justify-between gap-2 px-3 pb-3">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Languages size={18} />
                                        <Popover
                                            open={openTargetLanguage}
                                            onOpenChange={setOpenTargetLanguage}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={
                                                        openTargetLanguage
                                                    }
                                                    className="w-[250px] justify-between"
                                                >
                                                    {valueTargetLanguage
                                                        ? targetLanguages.find(
                                                              (language) =>
                                                                  language.value ===
                                                                  valueTargetLanguage,
                                                          )?.label
                                                        : 'Select target language...'}
                                                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Language..." />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            No language found.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {targetLanguages.map(
                                                                (language) => (
                                                                    <CommandItem
                                                                        key={
                                                                            language.value
                                                                        }
                                                                        value={
                                                                            language.value
                                                                        }
                                                                        onSelect={(
                                                                            currentValue,
                                                                        ) => {
                                                                            setValueTargetLanguage(
                                                                                currentValue ===
                                                                                    valueTargetLanguage
                                                                                    ? ''
                                                                                    : currentValue,
                                                                            )
                                                                            setOpenTargetLanguage(
                                                                                false,
                                                                            )
                                                                        }}
                                                                    >
                                                                        <CheckIcon
                                                                            className={cn(
                                                                                'mr-2 h-4 w-4',
                                                                                valueTargetLanguage ===
                                                                                    language.value
                                                                                    ? 'opacity-100'
                                                                                    : 'opacity-0',
                                                                            )}
                                                                        />
                                                                        {
                                                                            language.label
                                                                        }
                                                                    </CommandItem>
                                                                ),
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MessageCircleQuestionMark size={18} />
                                        <Popover
                                            open={openExplainLanguage}
                                            onOpenChange={
                                                setOpenExplainLanguage
                                            }
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={
                                                        openExplainLanguage
                                                    }
                                                    className="w-[250px] justify-between"
                                                >
                                                    {valueExplainLanguage
                                                        ? explainLanguages.find(
                                                              (language) =>
                                                                  language.value ===
                                                                  valueExplainLanguage,
                                                          )?.label
                                                        : 'Select explain language...'}
                                                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Language..." />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            No language found.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {explainLanguages.map(
                                                                (language) => (
                                                                    <CommandItem
                                                                        key={
                                                                            language.value
                                                                        }
                                                                        value={
                                                                            language.value
                                                                        }
                                                                        onSelect={(
                                                                            currentValue,
                                                                        ) => {
                                                                            setValueExplainLanguage(
                                                                                currentValue ===
                                                                                    valueExplainLanguage
                                                                                    ? ''
                                                                                    : currentValue,
                                                                            )
                                                                            setOpenExplainLanguage(
                                                                                false,
                                                                            )
                                                                        }}
                                                                    >
                                                                        <CheckIcon
                                                                            className={cn(
                                                                                'mr-2 h-4 w-4',
                                                                                valueExplainLanguage ===
                                                                                    language.value
                                                                                    ? 'opacity-100'
                                                                                    : 'opacity-0',
                                                                            )}
                                                                        />
                                                                        {
                                                                            language.label
                                                                        }
                                                                    </CommandItem>
                                                                ),
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BookMarked size={18} />
                                        <Popover
                                            open={openStoryType}
                                            onOpenChange={setOpenStoryType}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={
                                                        openStoryType
                                                    }
                                                    className="w-[250px] justify-between"
                                                >
                                                    {valueStoryType
                                                        ? storyTypes.find(
                                                              (story) =>
                                                                  story.value ===
                                                                  valueStoryType,
                                                          )?.label
                                                        : 'Select story type...'}
                                                    <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Story..." />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            No story found.
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            {storyTypes.map(
                                                                (story) => (
                                                                    <CommandItem
                                                                        key={
                                                                            story.value
                                                                        }
                                                                        value={
                                                                            story.value
                                                                        }
                                                                        onSelect={(
                                                                            currentValue,
                                                                        ) => {
                                                                            setValueStoryType(
                                                                                currentValue ===
                                                                                    valueStoryType
                                                                                    ? ''
                                                                                    : currentValue,
                                                                            )
                                                                            setOpenStoryType(
                                                                                false,
                                                                            )
                                                                        }}
                                                                    >
                                                                        <CheckIcon
                                                                            className={cn(
                                                                                'mr-2 h-4 w-4',
                                                                                valueStoryType ===
                                                                                    story.value
                                                                                    ? 'opacity-100'
                                                                                    : 'opacity-0',
                                                                            )}
                                                                        />
                                                                        {
                                                                            story.label
                                                                        }
                                                                    </CommandItem>
                                                                ),
                                                            )}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="icon"
                                        disabled={
                                            !valueExplainLanguage.trim() ||
                                            !valueTargetLanguage ||
                                            !valueStoryType.trim() ||
                                            isLoading
                                        }
                                        onClick={handleSubmit}
                                        className="size-9 rounded-full"
                                    >
                                        {!isLoading ? (
                                            <ArrowUp size={18} />
                                        ) : (
                                            <span className="size-3 rounded-xs bg-white" />
                                        )}
                                    </Button>
                                </div>
                            </PromptInputActions>
                        </div>
                    </PromptInput>
                </div>
            </div>
        </main>
    )
}

function FullChatApp() {
    const [stories, setStories] = useState<Story[]>([])
    const [newStoryId, setNewStoryId] = useState<string | undefined>(undefined)
    const { data } = useQuery<{ listStories: Story[] }>(LIST_ALL_STORIES)

    // On initial load, set stories from server
    useEffect(() => {
        if (data?.listStories) {
            // Sort stories by startedAt descending (newest first)
            const sortedStories = [...data.listStories].sort(
                (a, b) =>
                    new Date(b.startedAt).getTime() -
                    new Date(a.startedAt).getTime(),
            )
            setStories(sortedStories)
        }
    }, [data])

    // Handler to add new story to the top
    const handleNewStory = (story: Story) => {
        setStories((prev) => [story, ...prev])
        setNewStoryId(story.storyId)
    }

    return (
        <SidebarProvider>
            <ChatSidebar stories={stories} newStoryId={newStoryId} />
            <SidebarInset>
                <ChatContent onNewStory={handleNewStory} />
            </SidebarInset>
        </SidebarProvider>
    )
}

export { FullChatApp }
