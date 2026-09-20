import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="app-error">
      <h1>That page does not exist</h1>
      <p>The link may be out of date. Your study data is still where you left it.</p>
      <Link className="button button--primary" to="/dashboard">
        Go to dashboard
      </Link>
    </div>
  );
}
