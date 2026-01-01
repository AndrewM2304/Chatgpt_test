import { useState } from "react";

export const PasswordGate = ({
  passwordHash,
  onSetPassword,
  onVerifyPassword,
  statusMessage,
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isSetup = passwordHash === "";
  const isLoadingHash = passwordHash === null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!password.trim()) {
      setError("Please enter a password.");
      return;
    }
    setIsLoading(true);
    const success = isSetup
      ? await onSetPassword(password.trim())
      : await onVerifyPassword(password.trim());
    if (!success) {
      setError("That password did not match. Try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="gate">
      <div className="gate-card">
        <p className="eyebrow">Secure access</p>
        <h2>{isSetup ? "Set a shared password" : "Enter the shared password"}</h2>
        <p className="subtitle">
          {isSetup
            ? "Create one shared passphrase to unlock the cookbook for everyone you invite."
            : "Enter the shared passphrase to unlock your synced recipes."}
        </p>
        {statusMessage && <p className="status-banner">{statusMessage}</p>}
        {isLoadingHash ? (
          <p className="empty">Checking Supabase settings...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="shared-password">Shared password</label>
            <input
              id="shared-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your passphrase"
            />
            {error && <p className="error-text">{error}</p>}
            <button className="primary" type="submit" disabled={isLoading}>
              {isSetup ? "Save password" : "Unlock cookbook"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
