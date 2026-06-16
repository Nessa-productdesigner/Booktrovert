import React from 'react';
import { Link } from 'react-router-dom';
import './AuthLayout.css';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showLogo?: boolean;
}

export default function AuthLayout({ title, subtitle, children, showLogo = true }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__container">
        <div className="auth-layout__header">
          {showLogo && <Link to="/" className="auth-layout__logo">Booktrovert</Link>}
          <h1 className="auth-layout__title">{title}</h1>
          <p className="auth-layout__subtitle">{subtitle}</p>
        </div>
        
        <div className="auth-layout__content">
          {children}
        </div>
      </div>
    </div>
  );
}
