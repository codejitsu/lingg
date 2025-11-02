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
    MoreHorizontalIcon,
    TargetIcon,
    SparkleIcon,
    SquirrelIcon,
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
import { useParams, useNavigate } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { StoryInterface } from '@/models/Story.Interface'
import type { ChapterInterface } from '@/models/Chapter.Interface'
import {
    LIST_ALL_STORIES,
    FETCH_STORY_BY_ID,
    START_STORY,
    CHECK_TEMPLATE,
} from '@/models/graphql/graphql'

import type { FetchStoryResult } from '@/models/graphql/FetchStoryResult.Interface'
import type { ChatMessage } from '@/models/messages/ChatMessage.Interface'
import type { NextAction } from '@/models/messages/NextAction'
import ChapterStatusInterface from '@/models/ChapterStatus.Interface'
import HistoryLinks from './chat/sidebar/children/HistoryLinks.component'
import type { MistakeInterface } from '@/models/messages/Mistake.Interface'
import { TARGET_LANGUAGES, EXPLAIN_LANGUAGES, STORY_TYPES } from '@/models/constants'
import { StarIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Container } from './landing/Container'
import { ButtonGroup } from '@/components/ui/button-group'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { StartStoryResult } from '@/models/graphql/StartStoryResult.Interface'
import type { CheckTemplateResult } from '@/models/graphql/CheckTemplateResult.Interface'

// TODO - replace with real user ID from auth context
const userId = 'f257727e-94ab-44ac-aa0e-c4d51a0d67ac'
const targetLanguage = 'German'
const explainLanguage = 'Russian'

function ChatSidebar({
    stories,
    newStoryId,
    currentStoryId,
    onNewStory
}: {
    stories: StoryInterface[]
    newStoryId?: string
    currentStoryId?: string
    onNewStory: (storyType: string | null, targetLanguage: string | null, explainLanguage: string | null) => void
}) {
    const [hidden, setHidden] = useState(false)

    const [targetLanguageOverride, setTargetLanguageOverride] = useState<string | null>(targetLanguage) // TODO read this from user's profile
    const [explainLanguageOverride, setExplainLanguageOverride] = useState<string | null>(explainLanguage) // TODO read this from user's profile
    const [storyTypeOverride, setStoryTypeOverride] = useState<string | null>(null) // TODO read this from user's profile

    useEffect(() => {
        if (newStoryId) setHidden(false)
    }, [newStoryId])

    useEffect(() => {
        if (newStoryId) setTimeout(() => setHidden(true), 5000)
    }, [newStoryId])

    return (
        <Sidebar className="bg-white dark:bg-gray-900">  
            <div className="flex items-center justify-between px-4 pt-4 dark:bg-gray-900/95">
                <ButtonGroup>
                    <Button
                        size="lg"
                        className='bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600'
                        onClick={() => onNewStory(storyTypeOverride, targetLanguageOverride, explainLanguageOverride)}
                    >
                        New Story
                    </Button>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="lg" aria-label="More Options">
                        <MoreHorizontalIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 bg-white/80 text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                        <DropdownMenuLabel>Settings overrides</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="hover:bg-gray-800 dark:hover:bg-gray-700 dark:data-[state=open]:bg-gray-700">
                            <SquirrelIcon className="h-4 w-4 mr-2" />
                            Story type
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className='bg-white/80 text-slate-900 dark:bg-slate-800 dark:text-slate-100'>
                            <DropdownMenuRadioGroup
                                value={storyTypeOverride || ''}
                                onValueChange={value => setStoryTypeOverride(value)}
                            >
                                {STORY_TYPES.map((story: { value: string; label: string }) => (
                                    <DropdownMenuRadioItem 
                                        key={story.value} 
                                        value={story.value} 
                                        className="hover:bg-gray-800 dark:hover:bg-gray-700"
                                    >
                                        {story.label}
                                    </DropdownMenuRadioItem>
                                ))}
                            </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>                                  
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="hover:bg-gray-800 dark:hover:bg-gray-700 dark:data-[state=open]:bg-gray-700">
                            <TargetIcon className="h-4 w-4 mr-2" />
                            Target language
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className='bg-white/80 text-slate-900 dark:bg-slate-800 dark:text-slate-100'>
                            <DropdownMenuRadioGroup
                                value={targetLanguageOverride || ''}
                                onValueChange={value => setTargetLanguageOverride(value)}
                            >
                                {TARGET_LANGUAGES.map((lang: { value: string; label: string }) => (
                                    <DropdownMenuRadioItem 
                                        key={lang.value} 
                                        value={lang.value} 
                                        className="hover:bg-gray-800 dark:hover:bg-gray-700"
                                    >
                                        {lang.label}    
                                    </DropdownMenuRadioItem>
                                ))}                            
                            </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>                        
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="hover:bg-gray-800 dark:hover:bg-gray-700 dark:data-[state=open]:bg-gray-700">
                            <SparkleIcon className="h-4 w-4 mr-2" />
                            Explanation language
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className='bg-white/80 text-slate-900 dark:bg-slate-800 dark:text-slate-100'>
                            <DropdownMenuRadioGroup
                                value={explainLanguageOverride || ''}
                                onValueChange={value => setExplainLanguageOverride(value)}
                            >
                                {EXPLAIN_LANGUAGES.map((lang: { value: string; label: string }) => (
                                    <DropdownMenuRadioItem 
                                        key={lang.value} 
                                        value={lang.value} 
                                        className="hover:bg-gray-800 dark:hover:bg-gray-700"
                                    >
                                        {lang.label}
                                    </DropdownMenuRadioItem>
                                ))}                                
                            </DropdownMenuRadioGroup>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>                        
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </ButtonGroup>                
            </div>
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
    currentStoryId,
    storyTitle,
    isLoading,
    chatMessages,
    onVerifyChapter,
    setPlaceholders,
}: {
    currentStoryId?: string
    storyTitle?: string
    isLoading: boolean,
    chatMessages: ChatMessage[],
    onVerifyChapter: () => void,
    setPlaceholders: (placeholders: Record<string, string>) => void,
}) {
    const chatContainerRef = useRef<HTMLDivElement>(null)

    return (
        <main className="flex h-[95%] w-full flex-col overflow-hidden">
            {/* Header */
            //text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400 transition-colors
            }
            <header className="bg-white dark:bg-gray-900 z-10 flex h-16 w-full shrink-0 items-center gap-2 border-b border-gray-200 dark:border-gray-800 px-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                {storyTitle}
                <div className="flex flex-col items-end gap-2 p-4">
                    <Loader
                        variant="dots"
                        className={isLoading ? '' : 'hidden'}
                    />
                </div>                
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
                                className={`w-full max-w-md bg-white/80 text-slate-900 dark:bg-slate-800 dark:text-slate-100 ${currentStoryId ? 'hidden' : ''}`}
                            >
                                <PopcornIcon className="mx-auto mb-2 text-amber-400" />
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

                            console.log("Rendering message:", message)

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
                                            <div className="text-secondary-foreground prose flex-1 rounded-lg bg-white/80 text-slate-900 dark:bg-slate-800 dark:text-slate-100 text-left p-3">
                                                { isCompletedChapter ? (
                                                    <MessageContent className="bg-white/80 text-slate-900 dark:bg-slate-800 dark:text-slate-100 text-primary max-w-[85%] rounded-3xl px-5 py-2.5 sm:max-w-[100%] text-justify">
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

            <div className={`bg-background dark:bg-gray-900 z-10 shrink-0 px-3 pb-3 md:px-5 md:pb-5 ${ currentStoryId ? '' : 'hidden' }`}>
                <div className="mx-auto max-w-3xl">
                    <div className="flex justify-center mb-4">
                        <Button
                            size="lg"
                            disabled={isLoading}
                            onClick={() => onVerifyChapter()}
                            className='bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600'
                        >
                            Verify Chapter
                            {!isLoading ? (
                                <ArrowUp size={18} />
                            ) : (
                                <span className="size-3 rounded-xs bg-white" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    )
}

function FullChatApp() {
    const { storyId } = useParams<{ storyId: string }>()
    const navigate = useNavigate()

    console.log("storyId:", storyId)

    const [stories, setStories] = useState<StoryInterface[]>([])
    const [newStoryId, setNewStoryId] = useState<string | undefined>(undefined)
    const [currentStoryId, setCurrentStoryId] = useState<string | undefined>(storyId)

    useEffect(() => {
        setCurrentStoryId(storyId);
        // Clear newStoryId when switching to a different story (not the newly created one)
        if (storyId && storyId !== newStoryId) {
            setNewStoryId(undefined);
        }
    }, [storyId, newStoryId]);

    console.log("currentStoryId:", currentStoryId)

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

    const [isLoading, setIsLoading] = useState(false)

    const [startStory] = useMutation<StartStoryResult>(START_STORY)
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]) // TODO rename this to chapters
    const [storyTitle, setStoryTitle] = useState('Start a new story')

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

    const [checkTemplate] = useMutation<CheckTemplateResult>(CHECK_TEMPLATE)
    const [placeholders, setPlaceholders] = useState<Record<string, string>>({})

    useEffect(() => {
        // Don't clear messages if this is a newly created story
        if (currentStoryId !== newStoryId) {
            setChatMessages([])
        }
        
        if (currentStoryId) {
            const title = stories.find(story => story.storyId === currentStoryId)?.title

            if (title) {
                setStoryTitle(title)
            }

            setIsLoading(true)
        } else {
            setStoryTitle('Start a new story')
            setIsLoading(false)
            return
        }

        if (storyData?.fetchStoryById?.title) {
            setStoryTitle(storyData.fetchStoryById.title)
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
        }

        if (storyError) {
            let errorMessage = 'Unknown error'
            if (storyError instanceof Error) {
                errorMessage = storyError.message
            }
            // TODO mark message as error somehow
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
            setIsLoading(false)
        }
    }, [storyData, storyError, storyLoading, currentStoryId, newStoryId, stories])

    const onCreateNewStory = async (storyTypeOverride: string | null, targetLanguageOverride: string | null, explainLanguageOverride: string | null) => {
        setStoryTitle('Start a new story')
        setChatMessages([])
        setIsLoading(true)

        console.log("Creating new story with:", { storyTypeOverride, targetLanguageOverride, explainLanguageOverride })

        try {
            const { data } = await startStory({
                variables: {
                    userId,
                    clientRequestId: uuidv4(),
                    targetLanguage: targetLanguageOverride,
                    explainLanguage: explainLanguageOverride,
                    storyType: storyTypeOverride || STORY_TYPES[Math.floor(Math.random() * STORY_TYPES.length)].value,
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

                setNewStoryId(data.startStory.story.storyId)
                setCurrentStoryId(data.startStory.story.storyId)

                navigate(`/story/${data.startStory.story.storyId}`)
            }

            // Update the title with the returned story title
            if (data?.startStory?.story?.title) {
                setStoryTitle(data.startStory.story.title)
            }

            // Add the new story to the top of the list
            if (data?.startStory?.story) {
                handleNewStory({
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
                    role: 'error',
                    content: `Failed to start story: ${errorMessage}`,
                    template: `Failed to start story: ${errorMessage}`,
                    placeholders: [],
                    mistakes: []
                },
            ])
        } finally {
            setIsLoading(false)
        }
    }

    const onVerifyChapter = async () => {
        setIsLoading(true)

        try {
            console.log("StoryId:", currentStoryId)
            console.log("ChapterId:", chatMessages[chatMessages.length - 1].id)
            console.log("Placeholders:", Object.entries(placeholders).map(
                        ([name, text]) => ({ name, text }),
                    ))

            const nonErrors = chatMessages.filter(msg => msg.role !== 'error')
            if (nonErrors.length === 0) {
                setChatMessages((prev) => [
                    ...prev,
                    {
                        id: uuidv4(),
                        role: 'error',
                        content: 'No valid chapter found to verify.',
                        template: 'No valid chapter found to verify.',
                        placeholders: [],
                        mistakes: []
                    },
                ])
                setIsLoading(false)
                return
            }
            const lastChapter = nonErrors[nonErrors.length - 1]

            const { data } = await checkTemplate({
                variables: {
                    userId: userId,
                    storyId: currentStoryId,
                    chapterId: lastChapter.id,
                    clientRequestId: uuidv4(),
                    targetLanguage: targetLanguage, // TODO remove it, no need to pass it every time
                    explainLanguage: explainLanguage, // TODO remove it, no need to pass it every time
                    placeholders: Object.entries(placeholders).map(
                        ([name, text]) => ({ name, text }),
                    ),
                },
            })
            
            console.log("CheckTemplate data:", data)
            
            if (data?.checkTemplate?.chapter) {
                lastChapter.status = ChapterStatusInterface.Completed

                lastChapter.finalizedContent = Object.entries(placeholders).reduce(
                    (content, [name, text]) =>
                        content.replace(`{${name}}`, text),
                    lastChapter.template || '',
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
                    role: 'error',
                    content: `Failed to verify chapter: ${errorMessage}`,
                    template: `Failed to verify chapter: ${errorMessage}`,
                    placeholders: [],
                    mistakes: []
                },
            ])
        } finally {
            setIsLoading(false)
        }                
    }

    return (
            <div>
                <section className="relative overflow-hidden bg-gradient-to-br from-white via-white to-white/20 dark:from-gray-900 dark:via-gray-900 dark:to-primary-900/20">
                    <Container>
                        <SidebarProvider>
                            <ChatSidebar
                                stories={stories}
                                newStoryId={newStoryId}
                                currentStoryId={currentStoryId}
                                onNewStory={onCreateNewStory}
                            />
                            <SidebarInset className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                                <ChatContent
                                    currentStoryId={currentStoryId}
                                    storyTitle={storyTitle}
                                    isLoading={isLoading}
                                    chatMessages={chatMessages}
                                    onVerifyChapter={onVerifyChapter}
                                    setPlaceholders={setPlaceholders}
                                />
                            </SidebarInset>
                        </SidebarProvider>
                    </Container>
                </section>
            </div>
    )
}

export { FullChatApp }
