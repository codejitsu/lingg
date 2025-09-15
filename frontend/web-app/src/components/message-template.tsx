import React, { useState, type ChangeEvent } from 'react';

interface MessageTemplateProps {
    template: string;
    onChange?: (values: Record<string, string>) => void;
}

const PLACEHOLDER_REGEX = /\{(ph-\d+)\}/g;

export const MessageTemplate: React.FC<MessageTemplateProps> = ({ template, onChange }) => {
    // Find all unique placeholders
    const placeholders = Array.from(new Set([...template.matchAll(PLACEHOLDER_REGEX)].map(m => m[1])));

    // State for each placeholder value
    const [values, setValues] = useState<Record<string, string>>(
        placeholders.reduce((acc, ph) => ({ ...acc, [ph]: '' }), {})
    );

    // Handle input change
    const handleInputChange = (ph: string) => (e: ChangeEvent<HTMLInputElement>) => {
        const newValues = { ...values, [ph]: e.target.value };
        setValues(newValues);
        onChange?.(newValues);
    };

    // Split template into parts (text and placeholders)
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let idx = 0;

    PLACEHOLDER_REGEX.lastIndex = 0; // Reset regex state
    while ((match = PLACEHOLDER_REGEX.exec(template)) !== null) {
        const [placeholder, phName] = match;
        if (match.index > lastIndex) {
            parts.push(template.slice(lastIndex, match.index));
        }
        parts.push(
            <input
                key={phName + '-' + idx}
                type="text"
                value={values[phName] || ''}
                onChange={handleInputChange(phName)}
                style={{ margin: '0 4px' }}
                placeholder={phName}
            />
        );
        lastIndex = match.index + placeholder.length;
        idx++;
    }
    if (lastIndex < template.length) {
        parts.push(template.slice(lastIndex));
    }

    return <span>{parts}</span>;
};

export default MessageTemplate;