import { useState } from "react";

export const GroupGate = ({ onJoinGroup, onCreateGroup, statusMessage }) => {
  const [groupInput, setGroupInput] = useState("");
  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);

  const handleJoin = (event) => {
    event.preventDefault();
    setError("");

    const ok = onJoinGroup(groupInput);
    if (!ok) {
      setError("Enter a valid group code or invite link.");
    }
  };

  const handleCreate = async () => {
    setError("");
    setIsWorking(true);
    const code = await onCreateGroup({
      name: "Shared kitchen",
      duplicate: false,
    });
    setIsWorking(false);

    if (!code) {
      setError("Unable to create a new group right now.");
    }
  };

  return (
    <div className="gate">
      <div className="gate-card">
        <p className="eyebrow">Get started</p>
        <h2>Join a shared cookbook</h2>
        <p className="subtitle">
          Enter a group code to join an existing cookbook, or create a new one
          to start inviting people.
        </p>
        {statusMessage && <p className="status-banner">{statusMessage}</p>}
        <form onSubmit={handleJoin}>
          <label htmlFor="group-code">Group code or invite link</label>
          <input
            id="group-code"
            type="text"
            value={groupInput}
            onChange={(event) => setGroupInput(event.target.value)}
            placeholder="group-1234 or https://...invite=group-1234"
          />
          {error && <p className="error-text">{error}</p>}
          <button className="primary" type="submit" disabled={isWorking}>
            Join group
          </button>
        </form>
        <div className="gate-divider">or</div>
        <div className="gate-actions">
          <p>Need a new shared space?</p>
          <button
            className="secondary"
            type="button"
            onClick={handleCreate}
            disabled={isWorking}
          >
            Create new group
          </button>
        </div>
      </div>
    </div>
  );
};
