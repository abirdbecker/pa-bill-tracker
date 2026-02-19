export default function SponsorPopover({ sponsor, onClose }) {
  if (!sponsor) return null;

  const partyFull = sponsor.party === 'R' ? 'Republican' : 'Democrat';

  return (
    <>
      <div className="popover-overlay" onClick={onClose} />
      <div className="sponsor-popover">
        <div className="sponsor-popover__header">
          <img
            src={sponsor.photoUrl}
            alt={sponsor.name}
            className="sponsor-popover__photo"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div className="sponsor-popover__info">
            <div className="sponsor-popover__name">{sponsor.name}</div>
            <div className="sponsor-popover__meta">
              {sponsor.chamber} District {sponsor.district}
            </div>
            <span className={`sponsor-popover__party-badge sponsor-popover__party-badge--${sponsor.party}`}>
              {partyFull}
            </span>
          </div>
        </div>

        <div className="sponsor-popover__contact">
          {sponsor.email && (
            <div className="sponsor-popover__contact-row">
              <span>Email:</span>
              <a href={`mailto:${sponsor.email}`}>{sponsor.email}</a>
            </div>
          )}
          {sponsor.phone && (
            <div className="sponsor-popover__contact-row">
              <span>Phone:</span>
              <a href={`tel:${sponsor.phone}`}>{sponsor.phone}</a>
            </div>
          )}
          {sponsor.offices?.map((office, i) => (
            <div className="sponsor-popover__office" key={i}>
              <div className="sponsor-popover__office-name">{office.name}</div>
              <div>{office.details}</div>
            </div>
          ))}
          {!sponsor.email && !sponsor.phone && sponsor.offices?.length === 0 && (
            <div className="sponsor-popover__contact-row" style={{ color: 'var(--sand)' }}>
              No contact info available
            </div>
          )}
        </div>
      </div>
    </>
  );
}
