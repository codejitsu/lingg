import type { ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string | ReactNode;
  centered?: boolean;
}

export const SectionHeading = ({ eyebrow, title, description, centered = false }: SectionHeadingProps) => {
  const textAlign = centered ? 'text-center' : '';
  const maxWidth = centered ? 'max-w-3xl mx-auto' : 'max-w-3xl';

  return (
    <div className={`${textAlign} ${maxWidth}`}>
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
          {description}
        </p>
      )}
    </div>
  );
};
