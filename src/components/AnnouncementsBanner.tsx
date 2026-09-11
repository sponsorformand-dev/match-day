import React from 'react';
import { Announcement, ActiveTab } from '../types.ts';
import { AlertCircle, Bell, Megaphone, ChevronRight } from 'lucide-react';

interface AnnouncementsBannerProps {
  announcements: Announcement[];
  onNavigate?: (tab: ActiveTab) => void;
}

export const AnnouncementsBanner: React.FC<AnnouncementsBannerProps> = ({
  announcements,
  onNavigate,
}) => {
  const activeAnnouncements = announcements.filter((a) => a.active);

  if (activeAnnouncements.length === 0) return null;

  return (
    <div className="space-y-2 mb-3">
      {activeAnnouncements.map((ann) => {
        let bgStyle = 'bg-blue-50 border-blue-200 text-blue-900';
        let icon = <Megaphone className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />;
        let badge = 'INFO';

        if (ann.priority === 'urgent') {
          bgStyle = 'bg-[#C8102E]/10 border-[#C8102E]/30 text-[#081326]';
          icon = <AlertCircle className="w-4 h-4 text-[#C8102E] flex-shrink-0 mt-0.5 animate-bounce" />;
          badge = 'HASTER';
        } else if (ann.priority === 'important') {
          bgStyle = 'bg-amber-50 border-amber-200 text-amber-950';
          icon = <Bell className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />;
          badge = 'VIGTIGT';
        }

        const isClickable = Boolean(
          ann.actionTarget && ann.actionTarget !== 'none' && onNavigate
        );

        const handleClick = () => {
          if (isClickable && ann.actionTarget && onNavigate) {
            onNavigate(ann.actionTarget as ActiveTab);
          }
        };

        return (
          <div
            key={ann.id}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={isClickable ? handleClick : undefined}
            onKeyDown={
              isClickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClick();
                    }
                  }
                : undefined
            }
            className={`p-3 rounded-xl border flex items-start gap-2.5 shadow-xs transition-all ${
              isClickable
                ? 'cursor-pointer hover:opacity-95 active:scale-[0.99]'
                : ''
            } ${bgStyle}`}
          >
            {icon}
            <div className="flex-1 text-xs">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-extrabold uppercase text-[10px] tracking-wider px-1.5 py-0.2 rounded bg-black/10">
                  {badge}
                </span>
                <span className="font-bold text-xs">{ann.title}</span>
              </div>
              <p className="text-gray-700 leading-relaxed">{ann.message}</p>
            </div>
            {isClickable && (
              <div className="self-center pl-1 text-gray-400 shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
