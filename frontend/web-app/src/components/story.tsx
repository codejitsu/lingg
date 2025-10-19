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
    SidebarInset,
    SidebarProvider,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import {
    ArrowUp,
    BookMarked,
    Copy,
    CheckCheck,
    Languages,
    MessageCircleQuestionMark,
    Pencil,
    Trash,
    PopcornIcon,
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

import { useQuery, useMutation } from '@apollo/client/react'
import { v4 as uuidv4 } from 'uuid'
import { MessageTemplate } from '@/components/message-template'
import { useParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { StoryInterface } from '@/models/Story.Interface'
import type { ChapterInterface } from '@/models/Chapter.Interface'
import {
    LIST_ALL_STORIES,
    FETCH_STORY_BY_ID,
    START_STORY,
    CHECK_TEMPLATE,
} from '@/models/graphql/graphql'

import Header from './chat/sidebar/children/Header.component'
import type { FetchStoryResult } from '@/models/graphql/FetchStoryResult.Interface'
import type { ChatMessage } from '@/models/messages/ChatMessage.Interface'
import type { NextAction } from '@/models/messages/NextAction'
import ChapterStatusInterface from '@/models/ChapterStatus.Interface'
import HistoryLinks from './chat/sidebar/children/HistoryLinks.component'
import Footer from './chat/sidebar/children/Footer.component'
import type { MistakeInterface } from '@/models/messages/Mistake.Interface'
import { TARGET_LANGUAGES, EXPLAIN_LANGUAGES, STORY_TYPES } from '@/models/constants'
import { StarIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Container } from './landing/Container'

// TODO - replace with real user ID from auth context
const userId = 'f257727e-94ab-44ac-aa0e-c4d51a0d67ac'

function ChatSidebar({
    stories,
    newStoryId,
    currentStoryId,
}: {
    stories: StoryInterface[]
    newStoryId?: string
    currentStoryId?: string
}) {
    const [hidden, setHidden] = useState(false)

    useEffect(() => {
        if (newStoryId) setHidden(false)
    }, [newStoryId])

    useEffect(() => {
        if (newStoryId) setTimeout(() => setHidden(true), 5000)
    }, [newStoryId])

    return (
        <Sidebar className='bg-white dark:bg-gray-900'>
            <HistoryLinks
                stories={stories}
                newStoryId={newStoryId}
                currentStoryId={currentStoryId}
                hidden={hidden}
            />
            {/* <Footer /> */}
        </Sidebar>
    )
}

function ChatContent({
    onNewStory,
    currentStoryId,
}: {
    onNewStory: (story: StoryInterface) => void
    currentStoryId?: string
}) {
    type StartStoryResult = {
        startStory: {
            errors: { message: string }[]
            story: {
                storyId: string
                title: string
                startedAt: string
                chapters: ChapterInterface[]
            }
        }
    }

    type CheckTemplateResult = {
        checkTemplate: {
            errors: { message: string }[]
            mistakes: MistakeInterface[]
            chapter: ChapterInterface
        }
    }

    const [startStory] = useMutation<StartStoryResult>(START_STORY)
    const [checkTemplate] = useMutation<CheckTemplateResult>(CHECK_TEMPLATE)

    const [prompt, setPrompt] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
    const chatContainerRef = useRef<HTMLDivElement>(null)

    const [openTargetLanguage, setOpenTargetLanguage] = useState(false)
    const [valueTargetLanguage, setValueTargetLanguage] = useState('')

    const [openExplainLanguage, setOpenExplainLanguage] = useState(false)
    const [valueExplainLanguage, setValueExplainLanguage] = useState('')

    const [openStoryType, setOpenStoryType] = useState(false)
    const [valueStoryType, setValueStoryType] = useState('')

    const [isTyping, setIsTyping] = useState(false)

    const [title, setTitle] = useState('Start a new story')

    const [placeholders, setPlaceholders] = useState<Record<string, string>>({})

    const [storyId, setStoryId] = useState(currentStoryId)

    const {
        data: storyData,
        error: storyError,
        loading: storyLoading,
    } = useQuery<{ fetchStoryById: FetchStoryResult }>(FETCH_STORY_BY_ID, {
        variables: {
            userId,
            storyId: currentStoryId,
        },
        skip: !currentStoryId,
    })

    const [nextAction, setNextAction] = useState<NextAction | '...'>('...')

    useEffect(() => {
        setNextAction('...')

        if (currentStoryId) {
            setChatMessages([])
            setIsLoading(true)
            setIsTyping(true)
        } else {
            setNextAction('StartNewStory')            
            setChatMessages([])
            setTitle('Start a new story')
            setIsLoading(false)
            setIsTyping(false)
            return
        }

        if (storyData?.fetchStoryById?.title) {
            setTitle(storyData.fetchStoryById.title)
        }

        if (storyData?.fetchStoryById?.chapters) {
            setChatMessages(
                storyData.fetchStoryById.chapters.map((chapter) => ({
                    id: chapter.chapterId,
                    role: 'assistant',
                    content: chapter.content,
                    finalizedContent: chapter.finalizedContent,
                    template: chapter.template,
                    placeholders: chapter.placeholders,
                    status: chapter.status,
                    mistakes: []
                })),
            )

            if (storyData.fetchStoryById.chapters.length > 0) {
                const lastChapter =
                    storyData.fetchStoryById.chapters[
                        storyData.fetchStoryById.chapters.length - 1
                    ]
                if (lastChapter.status === ChapterStatusInterface.Created) {
                    setNextAction('VerifyChapter')
                } else if (
                    lastChapter.status ===
                    ChapterStatusInterface.VerifiedNoMistakes
                ) {
                    setNextAction('StartNewChapter')
                } else if (
                    lastChapter.status ===
                    ChapterStatusInterface.VerifiedWithMistakes
                ) {
                    setNextAction('FixMistakes')
                } else if (
                    lastChapter.status === ChapterStatusInterface.Completed
                ) {
                    setNextAction('StartNewChapter')
                }
            } else {
                setNextAction('StartNewStory')
            }
        }

        if (storyError) {
            let errorMessage = 'Unknown error'
            if (storyError instanceof Error) {
                errorMessage = storyError.message
            }
            setChatMessages((prev) => [
                ...prev,
                {
                    id: uuidv4(),
                    role: 'assistant',
                    content: `Failed to start story: ${errorMessage}`,
                    template: `Failed to start story: ${errorMessage}`,
                    placeholders: [],
                    mistakes: []
                },
            ])
        }

        if (!storyLoading) {
            setIsTyping(false)
            setIsLoading(false)
        }
    }, [storyData, storyError, storyLoading, currentStoryId])

    const handleSubmit = async () => {
        const isStartingNewStory = nextAction === 'StartNewStory'
        const isVerifyingChapter = nextAction === 'VerifyChapter'

        if (isStartingNewStory) {
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
                if (data?.startStory?.story?.chapters?.[0]?.template) {
                    setChatMessages((prev) => [
                        ...prev,
                        {
                            id: data.startStory.story.chapters[0].chapterId,
                            role: 'assistant',
                            content: data.startStory.story.chapters[0].content,
                            template: data.startStory.story.chapters[0].template,
                            placeholders:
                                data.startStory.story.chapters[0].placeholders,
                            status: data.startStory.story.chapters[0].status,
                            mistakes: [],
                        },
                    ])

                    setStoryId(data.startStory.story.storyId)

                    window.history.replaceState(null, '', `/#/story/${data.startStory.story.storyId}`)

                    setNextAction('VerifyChapter')
                }

                // Update the title with the returned story title
                if (data?.startStory?.story?.title) {
                    setTitle(data.startStory.story.title)
                }

                // Add the new story to the top of the list
                if (data?.startStory?.story) {
                    onNewStory({
                        storyId: data.startStory.story.storyId,
                        title: data.startStory.story.title,
                        startedAt: data.startStory.story.startedAt,
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
                        id: uuidv4(),
                        role: 'assistant',
                        content: `Failed to start story: ${errorMessage}`,
                        template: `Failed to start story: ${errorMessage}`,
                        placeholders: [],
                        mistakes: []
                    },
                ])
            } finally {
                setIsTyping(false)
                setIsLoading(false)
            }
        }

        if (isVerifyingChapter) {
            if (
                !valueTargetLanguage.trim() ||
                !valueExplainLanguage.trim()
            )
                return

            setIsLoading(true)
            setIsTyping(true)

            try {
                const { data } = await checkTemplate({
                    variables: {
                        userId: userId,
                        storyId: storyId,
                        chapterId: chatMessages[chatMessages.length - 1].id,
                        clientRequestId: uuidv4(),
                        targetLanguage: valueTargetLanguage,
                        explainLanguage: valueExplainLanguage,
                        placeholders: Object.entries(placeholders).map(
                            ([name, text]) => ({ name, text }),
                        ),
                    },
                })

                if (data?.checkTemplate?.chapter) {
                    chatMessages[chatMessages.length - 1].status = ChapterStatusInterface.Completed

                    chatMessages[chatMessages.length - 1].finalizedContent = Object.entries(placeholders).reduce(
                        (content, [name, text]) =>
                            content.replace(`{${name}}`, text),
                        chatMessages[chatMessages.length - 1].template || '',
                    )

                    // Update status of the latest chat message before adding a new chapter
                    setChatMessages((prev) => {
                        if (prev.length === 0) return prev
                        const updated = [...prev]
                        updated[updated.length - 1] = {
                            ...updated[updated.length - 1],
                            status: ChapterStatusInterface.Completed,
                        }
                        return updated
                    })

                    setChatMessages((prev) => [
                        ...prev,
                        {
                            id: data?.checkTemplate?.chapter.chapterId,
                            role: 'assistant',
                            content: data?.checkTemplate?.chapter.content,
                            finalizedContent: data?.checkTemplate?.chapter.finalizedContent,
                            template: data?.checkTemplate?.chapter.template,
                            placeholders: data?.checkTemplate?.chapter.placeholders,
                            status: data?.checkTemplate?.chapter.status,
                            mistakes: []
                        },
                    ])

                    setNextAction('VerifyChapter')
                }

                if (data?.checkTemplate?.mistakes) {
                    console.log(data?.checkTemplate.mistakes)
                    chatMessages[chatMessages.length - 1].mistakes = data?.checkTemplate.mistakes
                }

                if (data?.checkTemplate?.errors) {
                    console.log(data?.checkTemplate.errors)
                }
            } catch (error: unknown) {
                let errorMessage = 'Unknown error'
                if (error instanceof Error) {
                    errorMessage = error.message
                }
                setChatMessages((prev) => [
                    ...prev,
                    {
                        id: uuidv4(),
                        role: 'assistant',
                        content: `Failed to verify chapter: ${errorMessage}`,
                        template: `Failed to verify chapter: ${errorMessage}`,
                        placeholders: [],
                        mistakes: []
                    },
                ])
            } finally {
                setIsTyping(false)
                setIsLoading(false)
            }                
        }
    }

    return (
        <main className="flex h-[95%] w-full flex-col overflow-hidden">
            {/* Header */
            //text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors
            }
            <header className="bg-white dark:bg-gray-900 z-10 flex h-16 w-full shrink-0 items-center gap-2 border-b border-gray-200 dark:border-gray-800 px-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                {title}
            </header>

            <div
                ref={chatContainerRef}
                className="relative flex-1 overflow-y-auto"
            >
                <ChatContainerRoot className="h-full bg-white dark:bg-gray-900">
                    <ChatContainerContent className="space-y-0 px-5 py-12">
                        <div
                            className={`flex flex-col justify-center items-center h-[300px] text-left ${chatMessages.length > 0 ? 'hidden' : ''}`}
                        >
                            <Alert
                                variant="default"
                                className="bg-secondary w-full max-w-md"
                            >
                                <PopcornIcon className="mx-auto mb-2" />
                                <AlertTitle className="text-left">
                                    Hello!
                                </AlertTitle>
                                <AlertDescription className="text-left">
                                    You can select stories from the list or
                                    start a new one right away. Try it!
                                </AlertDescription>
                            </Alert>
                        </div>

                        {chatMessages.map((message) => {
                            const isAssistant = message.role === 'assistant'
                            const isCompletedChapter = message.status === ChapterStatusInterface.Completed

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
                                        <div className="group flex w-full flex-col gap-2">
                                            <div className="text-secondary-foreground prose flex-1 rounded-lg bg-secondary text-left p-3">
                                                { isCompletedChapter ? (
                                                    <MessageContent className="bg-muted text-primary max-w-[85%] rounded-3xl px-5 py-2.5 sm:max-w-[100%] text-justify">
                                                        {message.finalizedContent ? message.finalizedContent : "No content available"}
                                                    </MessageContent>
                                                ) : (
                                                    <MessageTemplate
                                                        template={
                                                            message.template
                                                        }
                                                        placeholdersMap={
                                                            message.placeholders
                                                        }
                                                        mistakes={message.mistakes}
                                                        onChange={(values) => setPlaceholders(values)}
                                                    />
                                                )
                                                }
                                            </div>
                                            <MessageActions
                                                className=
                                                    '-ml-2.5 self-end flex gap-0 py-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 text-right opacity-100'
                                                
                                            >
                                                <MessageAction
                                                    tooltip="Completed"
                                                    delayDuration={100}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="rounded-full"
                                                    >
                                                        <CheckCheck className={`size-4 ${isCompletedChapter ? "text-green-500" : ""}`}/>
                                                    </Button>
                                                </MessageAction>
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-blue-500 text-white dark:bg-blue-600"
                                                >
                                                    <StarIcon className="text-yellow-500 fill-yellow-300" />
                                                    42
                                                </Badge>                                                
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

            <div className="bg-background dark:bg-gray-900 z-10 shrink-0 px-3 pb-3 md:px-5 md:pb-5">
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
                        className="border-input bg-popover dark:bg-gray-900 relative z-10 w-full rounded-3xl border p-0 pt-1 shadow-xs"
                    >
                        <div className="flex flex-col">
                            <PromptInputActions className="mt-3 flex w-full items-center justify-between gap-2 px-3 pb-3">
                                {nextAction === 'StartNewStory' ||
                                nextAction === '...' || nextAction === 'VerifyChapter' ? (
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
                                                        aria-expanded={openTargetLanguage}
                                                        className="w-[250px] justify-between dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                                    >
                                                        {valueTargetLanguage
                                                            ? TARGET_LANGUAGES.find(
                                                                  (language: { value: string; label: string }) =>
                                                                      language.value === valueTargetLanguage,
                                                              )?.label
                                                            : 'Select target language...'}
                                                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[200px] p-0 dark:bg-gray-900 dark:border-gray-700">
                                                    <Command>
                                                        <CommandInput placeholder="Language..." className="dark:bg-gray-900 dark:text-gray-100" />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                No language found.
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {TARGET_LANGUAGES.map(
                                                                    (language: { value: string; label: string }) => (
                                                                        <CommandItem
                                                                            key={language.value}
                                                                            value={language.value}
                                                                            onSelect={(currentValue) => {
                                                                                setValueTargetLanguage(
                                                                                    currentValue === valueTargetLanguage
                                                                                        ? ''
                                                                                        : currentValue,
                                                                                )
                                                                                setOpenTargetLanguage(false)
                                                                            }}
                                                                            className="dark:text-gray-100"
                                                                        >
                                                                            <CheckIcon
                                                                                className={cn(
                                                                                    'mr-2 h-4 w-4',
                                                                                    valueTargetLanguage === language.value
                                                                                        ? 'opacity-100'
                                                                                        : 'opacity-0',
                                                                                )}
                                                                            />
                                                                            {language.label}
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
                                                onOpenChange={setOpenExplainLanguage}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={openExplainLanguage}
                                                        className="w-[250px] justify-between dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                                    >
                                                        {valueExplainLanguage
                                                            ? EXPLAIN_LANGUAGES.find(
                                                                  (language: { value: string; label: string }) =>
                                                                      language.value === valueExplainLanguage,
                                                              )?.label
                                                            : 'Select explain language...'}
                                                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[200px] p-0 dark:bg-gray-900 dark:border-gray-700">
                                                    <Command>
                                                        <CommandInput placeholder="Language..." className="dark:bg-gray-900 dark:text-gray-100" />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                No language found.
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {EXPLAIN_LANGUAGES.map(
                                                                    (language: { value: string; label: string }) => (
                                                                        <CommandItem
                                                                            key={language.value}
                                                                            value={language.value}
                                                                            onSelect={(currentValue) => {
                                                                                setValueExplainLanguage(
                                                                                    currentValue === valueExplainLanguage
                                                                                        ? ''
                                                                                        : currentValue,
                                                                                )
                                                                                setOpenExplainLanguage(false)
                                                                            }}
                                                                            className="dark:text-gray-100"
                                                                        >
                                                                            <CheckIcon
                                                                                className={cn(
                                                                                    'mr-2 h-4 w-4',
                                                                                    valueExplainLanguage === language.value
                                                                                        ? 'opacity-100'
                                                                                        : 'opacity-0',
                                                                                )}
                                                                            />
                                                                            {language.label}
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
                                                        aria-expanded={openStoryType}
                                                        className="w-[250px] justify-between dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
                                                    >
                                                        {valueStoryType
                                                            ? STORY_TYPES.find(
                                                                  (story: { value: string; label: string }) =>
                                                                      story.value === valueStoryType,
                                                              )?.label
                                                            : 'Select story type...'}
                                                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[200px] p-0 dark:bg-gray-900 dark:border-gray-700">
                                                    <Command>
                                                        <CommandInput placeholder="Story..." className="dark:bg-gray-900 dark:text-gray-100" />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                No story found.
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {STORY_TYPES.map(
                                                                    (story: { value: string; label: string }) => (
                                                                        <CommandItem
                                                                            key={story.value}
                                                                            value={story.value}
                                                                            onSelect={(currentValue) => {
                                                                                setValueStoryType(
                                                                                    currentValue === valueStoryType
                                                                                        ? ''
                                                                                        : currentValue,
                                                                                )
                                                                                setOpenStoryType(false)
                                                                            }}
                                                                            className="dark:text-gray-100"
                                                                        >
                                                                            <CheckIcon
                                                                                className={cn(
                                                                                    'mr-2 h-4 w-4',
                                                                                    valueStoryType === story.value
                                                                                        ? 'opacity-100'
                                                                                        : 'opacity-0',
                                                                                )}
                                                                            />
                                                                            {story.label}
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
                                ) : (
                                    <div></div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Button
                                        size="lg"
                                        disabled={
                                            nextAction === 'StartNewStory' &&
                                            (!valueExplainLanguage.trim() ||
                                                !valueTargetLanguage ||
                                                !valueStoryType.trim()) ||
                                            isLoading
                                        }
                                        onClick={handleSubmit}
                                        className="rounded-full dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                                    >
                                        {nextAction === '...'
                                            ? 'Start new story'
                                            : nextAction === 'StartNewStory'
                                            ? 'Start new story'
                                            : nextAction === 'VerifyChapter'
                                            ? 'Verify'
                                            : nextAction === 'FixMistakes'
                                            ? 'Recheck'
                                            : nextAction === 'StartNewChapter'
                                            ? 'New Chapter'
                                            : 'Error'}
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
    const { storyId } = useParams<{ storyId: string }>()

    // Ensure the main container uses full height and flex layout
    // Add a wrapper div with h-screen and flex

    const [stories, setStories] = useState<StoryInterface[]>([])
    const [newStoryId, setNewStoryId] = useState<string | undefined>(undefined)
    const { data } = useQuery<{ listStories: StoryInterface[] }>(
        LIST_ALL_STORIES,
        {
            variables: {
                userId,
            },
        },
    )

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
    const handleNewStory = (story: StoryInterface) => {
        setStories((prev) => [story, ...prev])
        setNewStoryId(story.storyId)
    }
    return (
            <div>
                <section className="relative overflow-hidden bg-gradient-to-br from-white via-white to-white/20 dark:from-gray-900 dark:via-gray-900 dark:to-primary-900/20">
                    <Container>
                        <SidebarProvider>
                            <ChatSidebar
                                stories={stories}
                                newStoryId={newStoryId}
                                currentStoryId={storyId}
                            />
                            <SidebarInset className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                                <ChatContent
                                    onNewStory={handleNewStory}
                                    currentStoryId={storyId}
                                />
                            </SidebarInset>
                        </SidebarProvider>
                    </Container>
                </section>
            </div>
    )
}

export { FullChatApp }
