import { Shield, Plus, Heart, User, FolderOpen, Flame, CloudRain, Scale } from 'lucide-react';
import type { EmergencyCategory } from '../types';

interface CategoryCardProps {
  id: EmergencyCategory;
  nameEn: string;
  nameHi: string;
  descEn: string;
  descHi: string;
  language: 'en' | 'hi';
  onClick: (id: EmergencyCategory) => void;
}

const CATEGORY_STYLES: Record<EmergencyCategory, {
  bg: string;
  iconBg: string;
  iconColor: string;
  glow: string;
  IconComponent: any;
}> = {
  cyber: {
    bg: 'hover:bg-blue-900/10 border-blue-500/10',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
    glow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    IconComponent: Shield,
  },
  medical: {
    bg: 'hover:bg-red-900/10 border-red-500/10',
    iconBg: 'bg-red-500/15',
    iconColor: 'text-red-400',
    glow: 'group-hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    IconComponent: Plus,
  },
  women: {
    bg: 'hover:bg-pink-900/10 border-pink-500/10',
    iconBg: 'bg-pink-500/15',
    iconColor: 'text-pink-400',
    glow: 'group-hover:shadow-[0_0_20px_rgba(236,72,153,0.15)]',
    IconComponent: Heart,
  },
  police: {
    bg: 'hover:bg-indigo-900/10 border-indigo-500/10',
    iconBg: 'bg-indigo-500/15',
    iconColor: 'text-indigo-400',
    glow: 'group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]',
    IconComponent: User,
  },
  lost: {
    bg: 'hover:bg-yellow-900/10 border-yellow-500/10',
    iconBg: 'bg-yellow-500/15',
    iconColor: 'text-yellow-400',
    glow: 'group-hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]',
    IconComponent: FolderOpen,
  },
  fire: {
    bg: 'hover:bg-orange-900/10 border-orange-500/10',
    iconBg: 'bg-orange-500/15',
    iconColor: 'text-orange-400',
    glow: 'group-hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]',
    IconComponent: Flame,
  },
  disaster: {
    bg: 'hover:bg-teal-900/10 border-teal-500/10',
    iconBg: 'bg-teal-500/15',
    iconColor: 'text-teal-400',
    glow: 'group-hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]',
    IconComponent: CloudRain,
  },
  legal: {
    bg: 'hover:bg-slate-700/10 border-slate-500/10',
    iconBg: 'bg-slate-500/15',
    iconColor: 'text-slate-300',
    glow: 'group-hover:shadow-[0_0_20px_rgba(148,163,184,0.15)]',
    IconComponent: Scale,
  },
};

export default function CategoryCard({
  id,
  nameEn,
  nameHi,
  descEn,
  descHi,
  language,
  onClick,
}: CategoryCardProps) {
  const styles = CATEGORY_STYLES[id] || CATEGORY_STYLES.cyber;
  const Icon = styles.IconComponent;
  const title = language === 'hi' ? nameHi : nameEn;
  const description = language === 'hi' ? descHi : descEn;

  return (
    <button
      id={`cat-card-${id}`}
      onClick={() => onClick(id)}
      className={`glass-card neon-border rounded-xl p-5 flex flex-col items-start gap-4 text-left group transition-all duration-300 hover:-translate-y-1 ${styles.bg} ${styles.glow} w-full`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${styles.iconBg} ${styles.iconColor} transition-transform duration-300 group-hover:scale-110`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="font-sans font-bold text-on-surface text-base md:text-lg tracking-tight transition-colors group-hover:text-white">
          {title}
        </h3>
        <p className="font-mono text-xs text-on-surface-variant/70 mt-1 uppercase tracking-wide leading-relaxed">
          {description}
        </p>
      </div>
    </button>
  );
}
