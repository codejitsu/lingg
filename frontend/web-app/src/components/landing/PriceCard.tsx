import { Button } from './Button';

interface PriceCardProps {
  title: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  popular?: boolean;
  isAnnual: boolean;
}

export const PriceCard = ({
  title,
  priceMonthly,
  priceAnnual,
  features,
  ctaLabel,
  ctaHref,
  popular = false,
  isAnnual,
}: PriceCardProps) => {
  const displayPrice = isAnnual ? priceAnnual / 12 : priceMonthly;
  const totalAnnual = isAnnual ? priceAnnual : priceMonthly * 12;
  const savings = priceMonthly * 12 - priceAnnual;
  const savingsPercent = Math.round((savings / (priceMonthly * 12)) * 100);

  return (
    <div
      className={`relative flex flex-col p-8 bg-white dark:bg-gray-800 rounded-2xl border-2 ${
        popular
          ? 'border-primary-600 dark:border-primary-500 shadow-xl'
          : 'border-gray-200 dark:border-gray-700 shadow-sm'
      }`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary-600 text-white text-sm font-semibold rounded-full">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
        <div className="flex items-baseline">
          <span className="text-5xl font-bold text-gray-900 dark:text-white">
            €{displayPrice.toFixed(0)}
          </span>
          <span className="ml-2 text-gray-600 dark:text-gray-400">/month</span>
        </div>
        {isAnnual && priceAnnual > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              €{totalAnnual} billed annually
            </p>
            {savings > 0 && (
              <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                Save {savingsPercent}%
              </p>
            )}
          </div>
        )}
      </div>

      <ul className="space-y-4 mb-8 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-3 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={popular ? 'primary' : 'secondary'}
        fullWidth
        onClick={() => (window.location.href = ctaHref)}
      >
        {ctaLabel}
      </Button>
    </div>
  );
};
