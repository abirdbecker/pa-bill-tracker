export default function Header({ generated }) {
  const date = generated ? new Date(generated).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  }) : '';

  return (
    <header className="header">
      <div className="header__top">
        <div>
          <h1 className="header__title">PA Legislation Tracker</h1>
          <p className="header__subtitle">
            Legislation affecting kids and technology in Pennsylvania — from phone-free schools to online safety.
          </p>
        </div>
        {date && <p className="header__meta">Updated {date}</p>}
      </div>
      <div className="header__methodology">
        <p>
          This tool automatically scans the Pennsylvania General Assembly website daily for bills related to phone-free schools, social media safety, student data privacy, online safety, and childhood independence. Bills are found by keyword search, and unrelated results are filtered out so only relevant legislation appears here. Click any bill to read the full text on palegis.us, or click a sponsor for contact info.
        </p>
      </div>
    </header>
  );
}
