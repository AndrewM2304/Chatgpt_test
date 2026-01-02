import { useState } from "react";

export const SettingsView = ({
  onGenerateInvite,
  onClearData,
  onJoinGroup,
  inviteUrl,
  statusMessage,
  hasGroup,
}) => {
  const [groupInput, setGroupInput] = useState("");
  const [groupError, setGroupError] = useState("");

  const handleJoin = (event) => {
    event.preventDefault();
    setGroupError("");
    const ok = onJoinGroup(groupInput);
    if (!ok) {
      setGroupError("Enter a valid group code or invite link.");
    }
  };

  return (
    <section className="settings">
      <div className="settings-card">
        <h2>Invite your group</h2>
        <p>
          Copy an invite link to sync this cookbook across devices or with a
          collaborator. If you don&apos;t have a group yet, we&apos;ll create one.
        </p>
        <div className="invite-actions">
          <button type="button" className="primary" onClick={onGenerateInvite}>
            Copy invite link
          </button>
        </div>
        {inviteUrl && (
          <div className="invite-link">
            <span>Invite link</span>
            <input type="text" readOnly value={inviteUrl} />
          </div>
        )}
        {!hasGroup && (
          <p className="status-banner">
            You’re currently working offline. Join a shared group whenever
            you’re ready.
          </p>
        )}
      </div>

      <div className="settings-card">
        <h2>Join an existing group</h2>
        <p>
          Paste a group code or invite link to sync with another cookbook.
        </p>
        {statusMessage && <p className="status-banner">{statusMessage}</p>}
        <form className="join-group-form" onSubmit={handleJoin}>
          <label htmlFor="join-group-code">Group code or invite link</label>
          <input
            id="join-group-code"
            type="text"
            value={groupInput}
            onChange={(event) => setGroupInput(event.target.value)}
            placeholder="group-1234 or https://...invite=group-1234"
          />
          {groupError && <p className="error-text">{groupError}</p>}
          <button className="primary" type="submit">
            Join group
          </button>
        </form>
      </div>

      <div className="settings-card danger-card">
        <h2>Danger zone</h2>
        <p>
          Remove all recipes, logs, and saved filters from this catalog. This
          action cannot be undone.
        </p>
        <button type="button" className="ghost danger" onClick={onClearData}>
          Delete all data
        </button>
      </div>
    </section>
  );
};
