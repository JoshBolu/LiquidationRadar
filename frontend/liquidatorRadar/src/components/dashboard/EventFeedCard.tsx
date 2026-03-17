import SectionCard from '../shared/SectionCard';
import type { EventFeedItem } from '../../types/dashboard';

interface EventFeedCardProps {
  items: EventFeedItem[];
}

const getBorderClass = (type: EventFeedItem['type']) => {
  switch (type) {
    case 'MINT':
    case 'PRICE_UPDATE':
      return 'border-brand-cyan';
    case 'LIQUIDATION':
      return 'border-rose-500';
    case 'INFO':
    default:
      return 'border-slate-600';
  }
};

const getTextClass = (type: EventFeedItem['type']) => {
  if (type === 'LIQUIDATION') {
    return 'text-slate-300';
  }
  return 'text-slate-300';
};

const EventFeedCard = ({ items }: EventFeedCardProps) => {
  return (
    <SectionCard title="Live Event Feed">
      <div
        className="space-y-3 max-h-[200px] overflow-y-auto pr-2"
        id="event-feed-container"
      >
        {items.length === 0 ? (
          <p className="text-slate-400 text-sm">No events yet. Feed will update via reactivity.</p>
        ) : items.map((item) => (
          <div
            key={item.id}
            className={`flex items-start space-x-3 text-xs p-2 rounded bg-brand-dark/30 border-l-2 ${getBorderClass(
              item.type,
            )}`}
          >
            <span className="text-slate-500 shrink-0">{item.timestamp}</span>
            <span className={getTextClass(item.type)}>{item.message}</span>
          </div>
        )) }
      </div>
    </SectionCard>
  );
};

export default EventFeedCard;

