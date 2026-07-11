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
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(shareUrl)}`
    : null;

  return (
    <>
      <div className="relative shrink-0">
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#7c5cff]/15 text-[#a78bfa] border border-[#7c5cff]/25 hover:bg-[#7c5cff]/25 backdrop-blur-sm transition-all disabled:opacity-50"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {loading ? 'Creating...' : copied ? 'Link copied!' : 'Share report'}
          </button>
          {shareUrl && (
            <button
              onClick={() => setShowQr(true)}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-muted-foreground border border-white/10 hover:border-[#7c5cff]/30 hover:text-[#a78bfa] backdrop-blur-sm transition-all"
              title="Show QR code"
            >
              <QrCode className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {error && <p className="text-[10px] text-amber-400 mt-1">{error}</p>}
      </div>

      {showQr && qrUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setShowQr(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative glass-modal p-6 w-full max-w-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-foreground">Scan to view report</span>
              <button
                onClick={() => setShowQr(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-center p-3 rounded-xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR code" className="w-[220px] h-[220px]" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center break-all leading-relaxed">
              {shareUrl}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
