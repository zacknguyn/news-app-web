import React from 'react';
import { ExternalLink, BarChart3, Sparkles } from 'lucide-react';
import type { BackendAdCampaignDTO } from '../lib/api';

interface AdCardProps {
  ad: BackendAdCampaignDTO;
  compact?: boolean;
}

export const AdCard: React.FC<AdCardProps> = ({ ad, compact }) => {
  if (compact) {
    return (
      <article className="group relative rounded-2xl bg-app-surface border border-app-border overflow-hidden shadow-[var(--shadow-tinted)] transition-all hover:shadow-lg hover:border-app-action/30">
        <a
          href={ad.landingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 p-4"
        >
          {ad.imageUrl && (
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-app-surface-alt">
              <img
                loading="lazy"
                src={ad.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Sparkles className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-app-faint">Sponsored</span>
            </div>
            <p className="text-sm font-bold text-app-heading truncate group-hover:text-app-action transition-colors">
              {ad.headline}
            </p>
            <p className="text-xs text-app-muted truncate mt-0.5">
              {ad.brandName} &mdash; {ad.body.slice(0, 80)}{ad.body.length > 80 ? '…' : ''}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-app-faint flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      </article>
    );
  }

  return (
    <article className="group relative rounded-2xl bg-app-surface border border-app-border overflow-hidden shadow-[var(--shadow-tinted)] transition-all hover:shadow-lg hover:border-app-action/30">
      {ad.imageUrl && (
        <a
          href={ad.landingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full h-48 overflow-hidden bg-app-surface-alt"
        >
          <img
            loading="lazy"
            src={ad.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
        </a>
      )}
      <div className="p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart3 className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-app-faint">Sponsored Content</span>
        </div>
        <a
          href={ad.landingUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <h3 className="font-serif text-lg font-bold text-app-heading mb-2 group-hover:text-app-action transition-colors">
            {ad.headline}
          </h3>
        </a>
        <p className="text-sm text-app-muted leading-relaxed mb-3 line-clamp-2">
          {ad.body}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-app-action">{ad.brandName}</span>
          <a
            href={ad.landingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-app-faint hover:text-app-action transition-colors"
          >
            Learn More <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </article>
  );
};
