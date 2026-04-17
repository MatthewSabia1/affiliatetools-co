type PricingLike = {
  startingMonthly: number | null;
  currency: 'USD' | 'EUR' | 'GBP';
  notes?: string | null;
  tiers?: Array<{
    billing?: 'monthly' | 'annual' | 'one-time' | 'custom';
  }>;
};

export function currencySymbolFor(currency: PricingLike['currency']): string {
  if (currency === 'EUR') return '€';
  if (currency === 'GBP') return '£';
  return '$';
}

function extractOneTimePrice(notes: string | null | undefined): string | null {
  const match = notes?.match(/([$€£])\s?([\d,]+)/u);
  if (!match) return null;
  return `${match[1]}${match[2]}`;
}

export function formatStartingPrice(
  pricing: PricingLike,
  options: {
    prefixFrom?: boolean;
    customLabel?: string;
    freeLabel?: string;
  } = {},
): string {
  const {
    prefixFrom = false,
    customLabel = 'Custom pricing',
    freeLabel = 'Free',
  } = options;

  if (pricing.startingMonthly === 0) {
    return freeLabel;
  }

  if (typeof pricing.startingMonthly === 'number') {
    const prefix = prefixFrom ? 'From ' : '';
    return `${prefix}${currencySymbolFor(pricing.currency)}${pricing.startingMonthly.toLocaleString('en-US')}/mo`;
  }

  const notes = pricing.notes?.toLowerCase() ?? '';
  const hasOneTimeModel =
    notes.includes('lifetime') ||
    notes.includes('one-time') ||
    Boolean(pricing.tiers?.some((tier) => tier.billing === 'one-time'));
  const parsedOneTimePrice = extractOneTimePrice(pricing.notes);

  if (hasOneTimeModel && parsedOneTimePrice) {
    return `${parsedOneTimePrice} lifetime`;
  }

  if (hasOneTimeModel) {
    return 'Lifetime pricing';
  }

  return customLabel;
}
