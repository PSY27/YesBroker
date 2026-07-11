'use client';

import { useState } from 'react';
import { Share2, Check, QrCode, X } from 'lucide-react';
import { createShareLink } from '@/lib/api';

interface ShareReportButtonProps {
  listingId: string;
  area?: string;
}

export function ShareReportButton({ listingId, area }: ShareReportButtonProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    setLoading(true);
    setError(null);
    try {
      const { url } = await createShareLink(listingId, area);
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create share link');
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = shareUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`
    : null;

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          onClick={handleShare}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7c5cff]/20 text-[#7c5cff] border border-[#7c5cff]/30 hover:bg-[#7c5cff]/30 transition-all disabled:opacity-50"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          {loading ? 'Creating...' : copied ? 'Link copied!' : 'Share report'}
        </button>
        {shareUrl && (
          <button
            onClick={() => setShowQr(!showQr)}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground border border-white/10 hover:border-white/20"
            title="Show QR code"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {error && <p className="text-[10px] text-red-400 mt-1">{error}</p>}

      {showQr && qrUrl && (
        <div className="absolute right-0 top-full mt-2 z-20 p-4 rounded-xl bg-[#1a1d2e] border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-foreground">Scan to view report</span>
            <button onClick={() => setShowQr(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="QR code" className="w-40 h-40 rounded-lg" />
          <p className="text-[10px] text-muted-foreground mt-2 max-w-[160px] truncate">{shareUrl}</p>
        </div>
      )}
    </div>
  );
}
