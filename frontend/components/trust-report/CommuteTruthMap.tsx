'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AgentResult } from '@/lib/types';
import { getCommuteEvidence } from '@/lib/evidence';

interface CommuteTruthMapProps {
  commuteFinding: AgentResult;
}

function CommuteMapInner({
  originLat,
  originLng,
  destLat,
  destLng,
  isLie,
}: {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  isLie: boolean;
}) {
  const [MapContainer, setMapContainer] = useState<React.ComponentType<{
    center: [number, number];
    zoom: number;
    style: React.CSSProperties;
    scrollWheelZoom: boolean;
    children: React.ReactNode;
  }> | null>(null);
  const [TileLayer, setTileLayer] = useState<React.ComponentType<{
    url: string;
    attribution: string;
  }> | null>(null);
  const [CircleMarker, setCircleMarker] = useState<React.ComponentType<{
    center: [number, number];
    radius: number;
    pathOptions: { color: string; fillColor: string; fillOpacity: number };
  }> | null>(null);
  const [Polyline, setPolyline] = useState<React.ComponentType<{
    positions: [number, number][];
    color: string;
    weight: number;
    dashArray?: string;
  }> | null>(null);

  useEffect(() => {
    import('react-leaflet').then((mod) => {
      setMapContainer(() => mod.MapContainer);
      setTileLayer(() => mod.TileLayer);
      setCircleMarker(() => mod.CircleMarker);
      setPolyline(() => mod.Polyline);
    });
    import('leaflet/dist/leaflet.css');
  }, []);

  if (!MapContainer || !TileLayer || !CircleMarker || !Polyline) {
    return (
      <div className="h-48 rounded-xl bg-white/5 flex items-center justify-center text-xs text-muted-foreground">
        Loading map...
      </div>
    );
  }

  const center: [number, number] = [
    (originLat + destLat) / 2,
    (originLng + destLng) / 2,
  ];

  return (
    <div className="h-52 rounded-xl overflow-hidden border border-white/10">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <CircleMarker
          center={[originLat, originLng]}
          radius={10}
          pathOptions={{ color: isLie ? '#ef4444' : '#22c55e', fillColor: isLie ? '#ef4444' : '#22c55e', fillOpacity: 0.8 }}
        />
        <CircleMarker
          center={[destLat, destLng]}
          radius={10}
          pathOptions={{ color: '#7c5cff', fillColor: '#7c5cff', fillOpacity: 0.8 }}
        />
        <Polyline
          positions={[
            [originLat, originLng],
            [destLat, destLng],
          ]}
          color={isLie ? '#ef4444' : '#22c55e'}
          weight={3}
          dashArray={isLie ? '8 8' : undefined}
        />
      </MapContainer>
    </div>
  );
}

const CommuteMapDynamic = dynamic(
  () => Promise.resolve(CommuteMapInner),
  { ssr: false, loading: () => <div className="h-52 rounded-xl bg-white/5 animate-pulse" /> }
);

export function CommuteTruthMap({ commuteFinding }: CommuteTruthMapProps) {
  const evidence = getCommuteEvidence(commuteFinding);
  if (!evidence) return null;

  const isLie = evidence.discrepancy_minutes >= 10;
  const hasCoords =
    evidence.origin_lat != null &&
    evidence.origin_lng != null &&
    evidence.destination_lat != null &&
    evidence.destination_lng != null;

  const chartData = [
    { name: 'Claimed', minutes: evidence.claimed_minutes, color: isLie ? '#ef4444' : '#22c55e' },
    { name: 'Metro (9AM)', minutes: evidence.metro_minutes, color: '#f59e0b' },
    { name: 'Drive to office', minutes: evidence.drive_minutes, color: '#7c5cff' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glassmorphic-card p-5"
    >
      <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2 uppercase tracking-wide">
        <span>🚗</span> Commute Truth Map
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Claimed vs peak-hour commute to {evidence.target_office}
      </p>

      {hasCoords && (
        <CommuteMapDynamic
          originLat={evidence.origin_lat!}
          originLng={evidence.origin_lng!}
          destLat={evidence.destination_lat!}
          destLng={evidence.destination_lng!}
          isLie={isLie}
        />
      )}

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className={`rounded-lg p-3 text-center border ${isLie ? 'border-red-500/40 bg-red-500/10' : 'border-white/10 bg-white/5'}`}>
          <p className="text-[10px] text-muted-foreground uppercase">Claimed</p>
          <p className={`text-lg font-bold ${isLie ? 'line-through text-red-400' : 'text-foreground'}`}>
            {evidence.claimed_minutes}m
          </p>
        </div>
        <div className="rounded-lg p-3 text-center border border-amber-500/30 bg-amber-500/10">
          <p className="text-[10px] text-muted-foreground uppercase">Metro peak</p>
          <p className="text-lg font-bold text-amber-300">{evidence.metro_minutes}m</p>
        </div>
        <div className="rounded-lg p-3 text-center border border-[#7c5cff]/30 bg-[#7c5cff]/10">
          <p className="text-[10px] text-muted-foreground uppercase">Drive</p>
          <p className="text-lg font-bold text-[#7c5cff]">{evidence.drive_minutes}m</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Distance: {evidence.distance_km} km
        {evidence.origin_label ? ` · ${evidence.origin_label}` : ''}
        {isLie && (
          <span className="text-red-400 ml-2">
            (+{evidence.discrepancy_minutes} min exaggeration)
          </span>
        )}
      </p>

      <div className="h-36 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 8 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="minutes" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
