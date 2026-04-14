import { useState } from 'react';
import { Zap, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradeBannerProps {
  /** Optional custom message override */
  message?: string;
}

export function UpgradeBanner({ message }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed) return null;

  return (
    <div
      id="upgrade-banner"
      className="w-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 text-white shadow-lg"
      role="alert"
    >
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 bg-white/20 rounded-full p-1.5">
          <Zap className="h-4 w-4 text-white" />
        </div>

        {/* Text */}
        <p className="flex-1 text-sm font-medium">
          {message ||
            "You've reached your free tier limit of 5 documents. Upgrade to Premium for unlimited uploads."}
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate('/roadmap')}
          className="flex-shrink-0 bg-white text-orange-600 font-bold text-xs px-3 py-1.5 rounded-full
                     hover:bg-orange-50 transition-colors shadow-sm"
        >
          Upgrade Now
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
