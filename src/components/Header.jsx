export default function Header({ generated }) {
  const date = generated ? new Date(generated).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  }) : '';

  return (
    <header className="header">
      <div className="header__top">
        <a href="https://paunplugged.org" className="home-link" title="PA Unplugged Home">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12L12 3l9 9"/><path d="M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/></svg>
        </a>
        <div>
          <h1 className="header__title"><span className="header__title-org">PA Unplugged</span> <span className="header__title-name">Legislation Tracker</span></h1>
          <p className="header__subtitle">
            Legislation affecting kids and technology in Pennsylvania — from phone-free schools to online safety.
          </p>
        </div>
        <div className="header__right">
          <a href="https://paunplugged.org" target="_blank" rel="noopener noreferrer" className="header__logo-link">
            <img src="/logo.png" alt="PA Unplugged" className="header__logo" />
          </a>
          {date && <p className="header__meta">Updated {date}</p>}
        </div>
      </div>
      <div className="header__methodology">
        <p>
          This tool automatically scans the Pennsylvania General Assembly website daily for bills related to phone-free schools, social media safety, student data privacy, online safety, and childhood independence. Bills are found by keyword search, and unrelated results are filtered out so only relevant legislation appears here. Click any bill to read the full text on palegis.us, or click a sponsor for contact info.
        </p>
      </div>
    </header>
  );
}
