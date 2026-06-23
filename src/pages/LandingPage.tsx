import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <main className="landing" id="landing-page">
      {/* Decorative floating book shapes */}
      <div className="landing__shapes" aria-hidden="true">
        <div className="landing__shape landing__shape--1">📖</div>
        <div className="landing__shape landing__shape--2">📚</div>
        <div className="landing__shape landing__shape--3">✨</div>
        <div className="landing__shape landing__shape--4">📕</div>
        <div className="landing__shape landing__shape--5">🔖</div>
        <div className="landing__shape landing__shape--6">📙</div>
        <div className="landing__shape landing__shape--7">📘</div>
        <div className="landing__shape landing__shape--8">📚</div>
        <div className="landing__shape landing__shape--9">📖</div>
      </div>

      {/* Hero content */}
      <div className="landing__content">
        <div className="landing__badge">
          <span className="landing__badge-dot" />
          For fiction readers who want more
        </div>

        <h1 className="landing__title">
          Your Reading,
          <br />
          <span className="landing__title-accent">Understood.</span>
        </h1>

        <p className="landing__subtitle">
          Track your books, tag what made them<br />unforgettable, and get recommendations that actually gets you.
        </p>

        <button
          id="get-started-button"
          className="landing__cta"
          onClick={() => navigate('/auth?mode=login')}
        >
          <span className="landing__cta-inner">
            Get Started
            <svg
              className="landing__cta-arrow"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.167 10h11.666M10.833 5l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.67"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

      </div>

      {/* Bottom fade */}
      <div className="landing__fade" aria-hidden="true" />
    </main>
  );
}
