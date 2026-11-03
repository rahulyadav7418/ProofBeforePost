import React from "react";

function Auth({
  mode,
  setMode,
  form,
  setForm,
  onSubmit,
  loading,
  error,
}) {
  const isLogin = mode === "login";

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>ProofBeforePost</h1>
        <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>
        <p>{isLogin ? "Login to your account" : "Register to continue"}</p>

        {!isLogin && (
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={handleChange}
            required
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : isLogin
              ? "Login"
              : "Sign Up"}
        </button>

        <p>
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          {" "}
          <button
            type="button"
            className="auth-switch"
            onClick={() => {
              setMode(isLogin ? "register" : "login");
            }}
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </form>
    </div>
  );
}

export default Auth;