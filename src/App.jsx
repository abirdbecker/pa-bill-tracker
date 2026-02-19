import { useBillData } from './hooks/useBillData';
import Header from './components/Header';
import IssueGroup from './components/IssueGroup';
import Footer from './components/Footer';
import './App.css';

export default function App() {
  const { data, loading, error } = useBillData();

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="loading__spinner" />
          <div className="loading__text">Loading bill data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <p>Failed to load bill data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header generated={data.generated} />
      {Object.entries(data.issues).map(([issueName, bills]) => (
        <IssueGroup key={issueName} name={issueName} bills={bills} />
      ))}
      <Footer />
    </div>
  );
}
