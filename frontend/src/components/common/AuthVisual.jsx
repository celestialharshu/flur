function AuthVisual() {
  return (
    <div className="auth-visual__box">
      <svg viewBox="0 0 400 400" className="auth-visual__svg">
        <rect x="110" y="90" width="60" height="260" rx="20" fill="#e85a4f" />
        <rect x="110" y="90" width="190" height="60" rx="20" fill="#e85a4f" />
        <rect x="110" y="190" width="140" height="55" rx="20" fill="#e85a4f" />
        <circle cx="290" cy="330" r="35" fill="#e85a4f" />
      </svg>
    </div>
  );
}

export default AuthVisual;