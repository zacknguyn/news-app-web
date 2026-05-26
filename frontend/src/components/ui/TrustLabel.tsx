import React from 'react';
import type { TrustMeta } from '../../lib/trust';
import { cn } from '../../lib/utils';

type TrustLabelProps = {
  trust: TrustMeta;
  className?: string;
};

export const TrustLabel: React.FC<TrustLabelProps> = ({ trust, className }) => (
  <span className={cn('font-semibold', trust.className, className)}>
    {trust.label}
  </span>
);
