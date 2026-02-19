import BillCard from './BillCard';

export default function IssueGroup({ name, bills }) {
  return (
    <section className="issue-group">
      <h2 className="issue-group__heading">
        {name}
        <span className="issue-group__count">{bills.length}</span>
      </h2>
      {bills.map(bill => (
        <BillCard key={bill.id} bill={bill} />
      ))}
    </section>
  );
}
