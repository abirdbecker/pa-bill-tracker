/**
 * Simplified 6-stage timeline:
 *   Introduced → 1st Chamber Committee → 1st Chamber Vote → 2nd Chamber Committee → 2nd Chamber Vote → Governor
 */

export default function StatusTimeline({ steps }) {
  if (!steps || steps.length === 0) return null;

  const introLabel = steps[0]?.label || '';
  const isSenateOrigin = /senate/i.test(introLabel);
  const c1 = isSenateOrigin ? 'Senate' : 'House';
  const c2 = isSenateOrigin ? 'House' : 'Senate';

  // Raw: 0=Introduced, 1=Referred, 2=Reported, 3=Vote, 4=Crosses, 5=Referred2, 6=Reported2, 7=Vote2, 8=Governor
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
      {stages.map((stage, i) => {
        const isLast = i === stages.length - 1;
        const isCurrent = stage.completed && (isLast || !stages[i + 1]?.completed);

        return (
          <div className={`timeline__segment ${isLast ? 'timeline__segment--last' : ''}`} key={i}>
            <div className="timeline__node">
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
            <span className={`timeline__label ${stage.vote ? 'timeline__label--vote' : ''}`}>
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function getVoteDetail(step) {
  if (!step?.label) return null;
  const voteMatch = step.label.match(/\((\d+-\d+)\)/);
  return voteMatch ? `Passed ${voteMatch[1]}` : null;
}
