export const SettingsView = ({
  onExport,
  onImport,
  onGenerateInvite,
  onCreateGroup,
  onClearData,
  inviteUrl,
}) => (
  <section className="settings">
    <div className="settings-card">
      <h2>Sharing & sync</h2>
      <p>
        Keep your catalog synced with Supabase and share it with a single invite
        link.
      </p>
      <div className="invite-actions">
        <button type="button" className="primary" onClick={onGenerateInvite}>
          Generate & copy invite link
        </button>
        <button type="button" className="ghost" onClick={onCreateGroup}>
          Create new group
        </button>
      </div>
      {inviteUrl && (
        <div className="invite-link">
          <span>Invite URL</span>
          <input type="text" readOnly value={inviteUrl} />
        </div>
      )}
    </div>

    <div className="settings-card">
      <h2>Backups</h2>
      <p>Export your recipes for safekeeping or import a saved catalog.</p>
      <div className="share-actions">
        <button type="button" className="primary" onClick={onExport}>
          Export catalog
        </button>
        <label className="ghost file-input">
          Import catalog
          <input type="file" accept="application/json" onChange={onImport} />
        </label>
      </div>
    </div>

    <div className="settings-card danger-card">
      <h2>Danger zone</h2>
      <p>
        Remove all recipes, logs, and saved filters from this catalog. This action
        cannot be undone.
      </p>
      <button type="button" className="ghost danger" onClick={onClearData}>
        Delete all data
      </button>
    </div>
  </section>
);
