import React, { useState, useEffect } from "react";
import { useUserViewModel } from "../../viewmodel/UserViewModel";
import { useNavigate } from "react-router-dom";
export const SignUp = () => {
  const navigate = useNavigate();
  const {
    email,
    nickname,
    password,
    message,
    loading,
    errors,
    passwordRequirements,
    setEmail,
    setNickname,
    setPassword,
    setMessage,
    handleSignUp,
    setLoading,
  } = useUserViewModel(navigate);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    if (confirmError && password === confirmPassword) setConfirmError("");
  }, [password, confirmPassword, confirmError]);

  const onSignUp = async () => {
    setConfirmError("");
    setMessage && setMessage("");
    if (password !== confirmPassword) {
      setConfirmError("Las contraseñas no coinciden");
      return;
    }
    try {
      await handleSignUp();
    } catch (err) {
      setConfirmError((err && err.message) || "Error al registrar");
    }
  };

  return (
    <div className="signup-wrapper" role="main">
      <div className="default-container with-border login-card signup-card" aria-live="polite">
        <header className="signup-header">
          <p className="signup-eyebrow">Create your account</p>
          <h1 className="signup-title">Sign up to plan smarter routes</h1>

        </header>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="error-text">{errors.email}</p>}

        <label htmlFor="nickname">Nickname</label>
        <input
          id="nickname"
          type="text"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          aria-invalid={!!errors.nickname}
        />
        {errors.nickname && <p className="error-text">{errors.nickname}</p>}

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
        />
        {errors.password && <p className="error-text">{errors.password}</p>}
        <p
          className="hint-text"
          style={{
            fontSize: "0.8rem",
            color: "rgba(0,0,0,0.6)",
            marginTop: 6,
            lineHeight: 1.3,
          }}
        >
          {passwordRequirements}
        </p>

        <label htmlFor="confirmPassword">Confirmar password</label>
        <input
          id="confirmPassword"
          type="password"
          placeholder="Confirmar password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {confirmError && <p className="error-text">{confirmError}</p>}

        <button
          onClick={onSignUp}
          disabled={loading}
          className="btn btn-primary signup-btn"
        >
          {loading ? "Creando cuenta..." : "Sign Up"}
        </button>



        <p className="signup-switch">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="link-button"
          >
            Log in
          </button>
        </p>

      </div>
    </div>
  );
};

export default SignUp;