import type { MistakeInterface } from '@/models/messages/Mistake.Interface'
import React, { useEffect, useState, type ChangeEvent } from 'react'

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card'
import { CircleAlert, MessageCircleWarning } from 'lucide-react'

interface MessageTemplateProps {
    template: string
    placeholdersMap: { name: string; text: string }[]
    mistakes: MistakeInterface[]
    onChange?: (values: Record<string, string>) => void
}

const PLACEHOLDER_REGEX = /\{(ph-\d+)\}/g

export const MessageTemplate: React.FC<MessageTemplateProps> = ({
    template,
    placeholdersMap,
    mistakes,
    onChange,
}) => {
    // Find all unique placeholders
    const placeholders = Array.from(
        new Set([...template.matchAll(PLACEHOLDER_REGEX)].map((m) => m[1])),
    )

    // State for each placeholder value
    const [values, setValues] = useState<Record<string, string>>(
        placeholders.reduce((acc, ph) => ({ ...acc, [ph]: '' }), {}),
    )

    useEffect(() => {
        onChange?.(values)
    }, [values, onChange])

    // Handle input change
    const handleInputChange =
        (ph: string) => (e: ChangeEvent<HTMLInputElement>) => {
            const newValues = { ...values, [ph]: e.target.value }
            setValues(newValues)
            onChange?.(newValues)
        }

    // Split template into parts (text and placeholders)
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    let match: RegExpExecArray | null
    let idx = 0

    PLACEHOLDER_REGEX.lastIndex = 0 // Reset regex state
    while ((match = PLACEHOLDER_REGEX.exec(template)) !== null) {
        const [placeholder, phName] = match
        if (match.index > lastIndex) {
            parts.push(template.slice(lastIndex, match.index))
        }

        // Find initial text for the placeholder from placeholdersMap
        const initialText =
            placeholdersMap.find((p) => p.name === phName)?.text || ''

        const replacementLength = initialText.length

        const mistakeForPlaceholder =
            mistakes.find((m) => m.placeholder.name === phName) || null

        let className =
            'inline-block border-b-3 border-double border-gray-500 focus:outline-none focus:border-pink-500'
        if (mistakeForPlaceholder) {
            className =
                'inline-block border-b-3 border-dotted border-red-500 focus:outline-none focus:border-red-500'
        }

        if (mistakeForPlaceholder === null) {
            parts.push(
                <input
                    key={phName + '-' + idx}
                    type="text"
                    value={values[phName] || ''}
                    onChange={handleInputChange(phName)}
                    className={className}
                    placeholder=""
                    maxLength={replacementLength}
                    spellCheck="false"
                    style={{ width: `${replacementLength}ch` }}
                />,
            )
        } else {
            parts.push(
                <span
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <input
                        key={phName + '-' + idx}
                        type="text"
                        value={values[phName] || ''}
                        onChange={handleInputChange(phName)}
                        className={className}
                        placeholder=""
                        maxLength={replacementLength}
                        spellCheck="false"
                        style={{ width: `${replacementLength}ch` }}
                    />
                    <HoverCard>
                        <HoverCardTrigger
                            style={{ marginRight: 4, cursor: 'pointer' }}
                        >
                            <MessageCircleWarning className="size-3 text-red-500" />
                        </HoverCardTrigger>
                        <HoverCardContent>
                            <div className="flex text-left items-center">
                                <CircleAlert className="size-4 text-gray-700 mr-2" />
                                {mistakeForPlaceholder.explanation}
                            </div>
                            <div className="text-muted-foreground text-xs">
                                {mistakeForPlaceholder.hint}
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                </span>,
            )
        }
        lastIndex = match.index + placeholder.length
        idx++
    }
    if (lastIndex < template.length) {
        parts.push(template.slice(lastIndex))
    }

    return <span>{parts}</span>
}

export default MessageTemplate
