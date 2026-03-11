export default function GameCard({ title, description, status, actions }) {
  return (
    <div className="game-card">
      <div className="game-card-header">
        <strong>{title}</strong>
        <span className={status === "Live" ? "badge live" : "badge soon"}>
          {status}
        </span>
      </div>

      <p>{description}</p>

      {actions ? <div className="game-actions">{actions}</div> : null}
    </div>
  );
}
