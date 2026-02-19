export default function Header({ totalBills, generated }) {
  const date = generated ? new Date(generated).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  }) : '';

  return (
    <header className="header">
      <img src="/logo.png" alt="PA Unplugged" className="header__logo" />
      <h1 className="header__title">PA Bill Tracker</h1>
      <p className="header__subtitle">
        Tracking {totalBills || 0} bills across Pennsylvania's legislature
      </p>
      {date && <p className="header__meta">Last updated {date}</p>}
    </header>
  );
}
