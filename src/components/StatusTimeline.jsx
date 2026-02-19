export default function StatusTimeline({ steps }) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="timeline">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const isCurrent = step.completed && (isLast || !steps[i + 1]?.completed);

        return (
          <div className="timeline__step" key={i}>
            <div className="timeline__step-wrapper">
              <div
                className={`timeline__dot ${
                  isCurrent ? 'timeline__dot--current' :
                  step.completed ? 'timeline__dot--completed' : ''
                }`}
                title={step.label}
              />
              <span className="timeline__label">{simplifyLabel(step.label)}</span>
            </div>
            {!isLast && (
              <div className={`timeline__line ${step.completed ? 'timeline__line--completed' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function simplifyLabel(label) {
  if (!label) return '';
  // Extract the first meaningful phrase
  const parts = label.split(' — ');
  const first = parts[0].trim();
  // Truncate long labels
  return first.length > 30 ? first.slice(0, 28) + '...' : first;
}
