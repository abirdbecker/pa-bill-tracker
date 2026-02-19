export default function Header({ totalBills, generated }) {
  const date = generated ? new Date(generated).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  }) : '';

  return (
    <header className="header">
      <h1 className="header__title">PA Unplugged Legislative Tracker</h1>
      <p className="header__subtitle">
        Tracking {totalBills || 0} bills in the Pennsylvania legislature that affect kids, families, and digital wellbeing.
      </p>
      <div className="header__methodology">
        <p>
          Every day, we automatically scan the Pennsylvania General Assembly website for bills related to phone-free schools, social media protections for minors, student data privacy, online safety, childhood independence, and more. Each bill listed here was found by searching for relevant keywords in active legislation, then verified by our team to filter out false matches. Click any bill to read the full text on palegis.us, or click a sponsor to see their contact info.
        </p>
      </div>
      {date && <p className="header__meta">Last updated {date}</p>}
    </header>
  );
}
