import React, { useState } from "react";

function Auth({ mode, setMode, form, setForm, onSubmit, loading, error }) {
  const isLogin = mode === "login";
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function switchMode() {
    setMode(isLogin ? "register" : "login");
    setShowPassword(false);
  }

  return (
    <main className="auth-container">
      <section className="auth-showcase">
        <div className="auth-brand">
          <div className="auth-brand-icon">P</div>
          <span>ProofBeforePost</span>
        </div>

        <div className="auth-showcase-content">
          <span className="auth-eyebrow">EVIDENCE-FIRST BRAND GOVERNANCE</span>

          <h1>
            Make every
            <br />
            claim <span>accountable.</span>
          </h1>

          <p>
            Review content, verify supporting evidence, and protect brand
            credibility before anything goes public.
          </p>

          <div className="auth-feature-list">
            <div>✓ Evidence-based content auditing</div>
            <div>✓ Transparent human review</div>
            <div>✓ Accountable brand governance</div>
          </div>
        </div>

        <p className="auth-showcase-footer">
          Built for responsible and trustworthy content.
        </p>
      </section>

      <section className="auth-form-section">
        <form className="auth-card" onSubmit={onSubmit}>
          <div className="auth-mobile-brand">
            <div className="auth-brand-icon">P</div>
            <span>ProofBeforePost</span>
          </div>

          <span className="auth-form-eyebrow">
            {isLogin ? "WELCOME BACK" : "GET STARTED"}
          </span>

          <h2>{isLogin ? "Welcome back!" : "Create your account"}</h2>

          <p className="auth-description">
            {isLogin
              ? "Sign in to continue to your workspace."
              : "Join ProofBeforePost and manage content responsibly."}
          </p>

          {!isLogin && (
            <div className="auth-field">
              <label htmlFor="auth-name">Full name</label>
              <input
                id="auth-name"
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>

            <div className="auth-password-wrapper">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />

              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isLogin
                ? "Sign in to workspace →"
                : "Create account →"}
          </button>

          <div className="auth-switch-text">
            {isLogin ? "Don't have an account?" : "Already have an account?"}

            <button type="button" className="auth-switch" onClick={switchMode}>
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>

          <p className="auth-security-note">
            Your workspace is protected with secure authentication.
          </p>
        </form>
      </section>
    </main>
  );
}

export default Auth;
