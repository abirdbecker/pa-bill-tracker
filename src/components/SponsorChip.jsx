import { useState, useRef } from 'react';
import SponsorPopover from './SponsorPopover';

export default function SponsorChip({ sponsor, coSponsorCount }) {
  const [showPopover, setShowPopover] = useState(false);
  const chipRef = useRef(null);

  if (!sponsor) return null;

  return (
    <div className="sponsor-section">
      <div className="sponsor-chip" ref={chipRef} onClick={() => setShowPopover(!showPopover)}>
        <img
          src={sponsor.photoUrl}
          alt={sponsor.name}
          className="sponsor-chip__photo"
          onError={e => { e.target.style.display = 'none'; }}
        />
        <span className="sponsor-chip__name">{sponsor.name}</span>
        <span className={`sponsor-chip__party sponsor-chip__party--${sponsor.party}`}>
          {sponsor.party}
        </span>
        <span className="sponsor-chip__district">Dist. {sponsor.district}</span>

        {showPopover && (
          <SponsorPopover sponsor={sponsor} onClose={() => setShowPopover(false)} />
        )}
      </div>

      {coSponsorCount > 0 && (
        <span className="sponsor-chip__cosponsor-count">
          +{coSponsorCount} co-sponsor{coSponsorCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
