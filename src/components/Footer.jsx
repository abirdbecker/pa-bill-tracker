export default function Footer() {
  return (
    <footer className="footer">
      <p>
        Built by{' '}
        <a href="https://paunplugged.com" target="_blank" rel="noopener noreferrer">
          PA Unplugged
        </a>
      </p>
      <p style={{ marginTop: 4 }}>
        Data sourced from{' '}
        <a href="https://www.palegis.us" target="_blank" rel="noopener noreferrer">
          palegis.us
        </a>
        . Refreshed daily.
      </p>
    </footer>
  );
}
