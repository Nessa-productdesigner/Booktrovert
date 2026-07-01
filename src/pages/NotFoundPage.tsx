import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const { session } = useAuthStore();
  
  // If the user is logged in, send them to the shelf. If not, send to landing page.
  const backLink = session ? '/shelf' : '/';

  return (
    <main className="not-found" id="not-found-page">
      <div className="not-found__brand">
        <Link to="/" className="not-found__logo">Booktrovert</Link>
      </div>
      
      <div className="not-found__content">
        <div className="not-found__icon" aria-hidden="true">👻</div>
        <h1 className="not-found__title">This page wandered off the shelf</h1>
        <p className="not-found__subtitle">
          The page you're looking for doesn't exist.
        </p>
        
        <Link to={backLink} className="not-found__cta">
          Back to my shelf
        </Link>
      </div>
    </main>
  );
}
