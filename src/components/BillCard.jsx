import StatusTimeline from './StatusTimeline';
import SponsorChip from './SponsorChip';

export default function BillCard({ bill }) {
  const displayId = bill.id.replace(/^(SB|HB|SR|HR)(\d+)$/, '$1 $2');

  return (
    <div className="bill-card">
      <div className="bill-card__header">
        <span className="bill-card__id">{displayId}</span>
        <div className="bill-card__titles">
          {bill.nickname && (
            <div className="bill-card__nickname">{bill.nickname}</div>
          )}
          {bill.description ? (
            <div className="bill-card__description">{bill.description}</div>
          ) : (
            <div className={bill.nickname ? 'bill-card__title' : 'bill-card__nickname'}>
              {bill.title}
            </div>
          )}
        </div>
      </div>

      <StatusTimeline steps={bill.timeline} />

      {bill.note && <div className="bill-card__note">{bill.note}</div>}

      {bill.lastAction && (
        <div className="bill-card__last-action">Last action: {bill.lastAction}</div>
      )}

      <div className="bill-card__footer">
        <SponsorChip sponsor={bill.primeSponsor} coSponsorCount={bill.coSponsorCount} />
        <a
          className="bill-card__link"
          href={bill.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on palegis.us &rarr;
        </a>
      </div>
    </div>
  );
}
