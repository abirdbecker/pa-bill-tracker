/**
 * Simplified 5-stage timeline:
 *   Introduced → 1st Chamber Committee → 1st Chamber Vote → 2nd Chamber Committee → 2nd Chamber Vote → Governor
 *
 * Maps from the 9 raw palegis.us steps into these stages.
 */

const STAGES = [
  { key: 'introduced', label: 'Introduced' },
  { key: 'committee1', label: '' },       // filled dynamically: "Senate Committee" or "House Committee"
  { key: 'vote1', label: '', vote: true }, // "Senate Vote" or "House Vote"
  { key: 'committee2', label: '' },        // opposite chamber
  { key: 'vote2', label: '', vote: true },
  { key: 'governor', label: 'Governor' },
];

export default function StatusTimeline({ steps, billId }) {
  if (!steps || steps.length === 0) return null;

  // Detect origin chamber from the first step
  const introLabel = steps[0]?.label || '';
  const isSenateOrigin = /senate/i.test(introLabel);
  const c1 = isSenateOrigin ? 'Senate' : 'House';
  const c2 = isSenateOrigin ? 'House' : 'Senate';

  // Map raw 9 steps → 6 simplified stages
  // Raw: 0=Introduced, 1=Referred, 2=Reported from committee, 3=Vote, 4=Crosses to 2nd chamber, 5=Referred 2nd, 6=Reported 2nd, 7=Vote 2nd, 8=Governor
  const stages = [
    { label: 'Introduced', completed: steps[0]?.completed || false, vote: false },
    { label: `${c1} Committee`, completed: steps[1]?.completed || false, vote: false },
    { label: `${c1} Vote`, completed: steps[3]?.completed || false, vote: true, detail: getVoteDetail(steps[3]) },
    { label: `${c2} Committee`, completed: steps[5]?.completed || false, vote: false },
    { label: `${c2} Vote`, completed: steps[7]?.completed || false, vote: true, detail: getVoteDetail(steps[7]) },
    { label: 'Governor', completed: steps[8]?.completed || false, vote: false },
  ];

  return (
    <div className="timeline">
      <div className="timeline__track">
        {stages.map((stage, i) => {
          const isLast = i === stages.length - 1;
          const isCurrent = stage.completed && (isLast || !stages[i + 1]?.completed);

          return (
            <div className="timeline__step" key={i}>
              <div
                className={`timeline__dot ${
                  isCurrent ? 'timeline__dot--current' :
                  stage.completed ? 'timeline__dot--completed' : ''
                } ${stage.vote ? 'timeline__dot--vote' : ''}`}
                title={stage.detail || stage.label}
              />
              {!isLast && (
                <div className={`timeline__line ${stage.completed ? 'timeline__line--completed' : ''}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="timeline__labels">
        {stages.map((stage, i) => (
          <span key={i} className={`timeline__label ${stage.vote ? 'timeline__label--vote' : ''}`}>
            {stage.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function getVoteDetail(step) {
  if (!step?.label) return null;
  // Extract vote count if present, e.g. "final passage (46-1)"
  const voteMatch = step.label.match(/\((\d+-\d+)\)/);
  return voteMatch ? `Passed ${voteMatch[1]}` : null;
}
