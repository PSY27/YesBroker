'use client';

import { motion } from 'framer-motion';
import { AgentResult } from '@/lib/types';
import { getPhotoEvidence, resolveMediaUrl } from '@/lib/evidence';
import { ExternalLink } from 'lucide-react';

interface PhotoForensicsPanelProps {
  photoFinding: AgentResult;
}

function PhotoCard({
  src,
  label,
  sublabel,
  borderClass,
}: {
  src: string;
  label: string;
  sublabel?: string;
  borderClass: string;
}) {
  const url = resolveMediaUrl(src);
  return (
    <div className={`flex-1 rounded-xl overflow-hidden border-2 ${borderClass} bg-black/20`}>
      <div className="aspect-video relative bg-white/5">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No preview
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs font-semibold text-foreground">{label}</p>
        {sublabel && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

export function PhotoForensicsPanel({ photoFinding }: PhotoForensicsPanelProps) {
  const evidence = getPhotoEvidence(photoFinding);
  if (!evidence) return null;

  const isSuspicious = evidence.is_stolen || photoFinding.verdict !== 'CLEAN';
  const sourcePhoto =
    evidence.source_photo ||
    evidence.matches[0]?.source_url ||
    '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glassmorphic-card p-5"
    >
      <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2 uppercase tracking-wide">
        <span>🖼️</span> Photo Forensics
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Reverse image search across Indian rental portals
      </p>

      {!isSuspicious || evidence.matches.length === 0 ? (
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {sourcePhoto && (
            <PhotoCard
              src={sourcePhoto}
              label="Listing photo"
              borderClass="border-[#22c55e]/50"
            />
          )}
          <div className="flex-1 text-center sm:text-left">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30">
              No duplicates found
            </span>
            <p className="text-sm text-muted-foreground mt-2">{photoFinding.detail}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {evidence.matches.map((match, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row gap-3 items-stretch">
              <PhotoCard
                src={match.source_url || sourcePhoto}
                label="This listing"
                sublabel="Uploaded photo"
                borderClass="border-red-500/60"
              />
              <div className="flex items-center justify-center text-red-400 font-bold text-lg px-2">
                =
              </div>
              <div className="flex-1 rounded-xl border-2 border-amber-500/50 bg-black/20 overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-amber-900/20 to-red-900/20 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-2xl mb-2">⚠️</span>
                  <p className="text-xs font-semibold text-foreground">Found elsewhere</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{match.label}</p>
                  <a
                    href={match.match_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[10px] text-[#7c5cff] hover:underline"
                  >
                    {match.portal}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="p-3 border-t border-white/5">
                  <p className="text-[10px] text-muted-foreground truncate">{match.match_url}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {evidence.watermarks.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {evidence.watermarks.map((mark) => (
            <span
              key={mark}
              className="px-2 py-1 rounded-md text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30"
            >
              Watermark: {mark}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
