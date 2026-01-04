import { useState } from "react";

export const SettingsView = ({
  onGenerateInvite,
  onLogout,
  onJoinGroup,
  onCopyGroupCode,
  onInstallApp,
  cookbookOptions = [],
  cookbookCovers = {},
  onUploadCookbookCover,
  inviteUrl,
  groupCode,
  groupId,
  status,
  isSaving,
  pendingChanges,
  lastSyncAt,
  lastSaveAt,
  diagnostics,
  isDiagnosticsRunning,
  onRunDiagnostics,
  statusMessage,
  hasGroup,
  canInstallApp,
  isInstalled,
  isIosDevice,
}) => {
  const [groupInput, setGroupInput] = useState("");
  const [groupError, setGroupError] = useState("");
  const [selectedCookbook, setSelectedCookbook] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const installHelp =
    "On iPhone or iPad, open the Share menu, tap the three-dot menu, then choose “Add to Home Screen” to save the catalog page. On Android, open the browser menu and tap “Install app.”";
  const formatTimestamp = (value) => {
    if (!value) {
      return "Not yet";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "Not yet";
    }
    return parsed.toLocaleString();
  };

  const handleJoin = (event) => {
    event.preventDefault();
    setGroupError("");
    const ok = onJoinGroup(groupInput);
    if (!ok) {
      setGroupError("Enter a valid group code or invite link.");
    }
  };

  const handleCoverUpload = async (event) => {
    event.preventDefault();
    setUploadError("");
    setUploadStatus("");

    if (!selectedCookbook) {
      setUploadError("Select a cookbook or website first.");
      return;
    }

    if (!selectedFile) {
      setUploadError("Choose an image to upload.");
      return;
    }

    if (!onUploadCookbookCover) {
      setUploadError("Upload is unavailable.");
      return;
    }

    setIsUploading(true);
    try {
      const result = await onUploadCookbookCover(
        selectedCookbook,
        selectedFile
      );

      if (!result?.ok) {
        setUploadError(result?.error || "Upload failed. Please try again.");
        return;
      }

      setSelectedFile(null);
      setFileInputKey((prev) => prev + 1);
      setUploadStatus(`Artwork saved for ${selectedCookbook}.`);
    } catch (error) {
      setUploadError(error?.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const selectedCover = selectedCookbook
    ? cookbookCovers?.[selectedCookbook]
    : "";
  const errorDetails = status?.details;

  return (
    <section className="settings">
      <div className="settings-card">
        <h2>Invite your group</h2>
        <p>
          Copy an invite link to sync this cookbook across devices or with a
          collaborator. If you don&apos;t have a group yet, we&apos;ll create one.
          Keep the group code handy—you&apos;ll need it to re-add the group later.
        </p>
        <div className="invite-actions">
          <button type="button" className="primary" onClick={onGenerateInvite}>
            Copy invite link
          </button>
        </div>
        {hasGroup && groupCode && (
          <div className="invite-code">
            <button
              type="button"
              className="invite-code-button"
              onClick={onCopyGroupCode}
              aria-label={`Copy group code ${groupCode}`}
            >
              {groupCode}
            </button>
          </div>
        )}
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
        <h2>Sync diagnostics</h2>
        <p>
          Share this status between devices to compare Supabase connectivity and
          group details.
        </p>
        <dl className="sync-details">
          <div>
            <dt>Connection</dt>
            <dd className="sync-status">
              {status?.message || "Sync status unavailable."}
            </dd>
          </div>
          {errorDetails && (
            <div>
              <dt>Last error details</dt>
              <dd>
                <ul className="sync-diagnostics">
                  {errorDetails.name && <li>Name: {errorDetails.name}</li>}
                  {errorDetails.code && <li>Code: {errorDetails.code}</li>}
                  {errorDetails.message && <li>Message: {errorDetails.message}</li>}
                  {errorDetails.details && <li>Details: {errorDetails.details}</li>}
                  {errorDetails.hint && <li>Hint: {errorDetails.hint}</li>}
                </ul>
              </dd>
            </div>
          )}
          <div>
            <dt>Group code</dt>
            <dd>{groupCode || "Not connected"}</dd>
          </div>
          <div>
            <dt>Group id</dt>
            <dd>{groupId || "Not connected"}</dd>
          </div>
          <div>
            <dt>Pending changes</dt>
            <dd>
              {pendingChanges ? "Waiting to save changes" : "No pending changes"}
            </dd>
          </div>
          <div>
            <dt>Save in progress</dt>
            <dd>{isSaving ? "Saving to Supabase" : "Idle"}</dd>
          </div>
          <div>
            <dt>Last sync</dt>
            <dd>{formatTimestamp(lastSyncAt)}</dd>
          </div>
          <div>
            <dt>Last save</dt>
            <dd>{formatTimestamp(lastSaveAt)}</dd>
          </div>
          <div>
            <dt>RLS check</dt>
            <dd>
              <button
                type="button"
                className="secondary"
                onClick={onRunDiagnostics}
                disabled={isDiagnosticsRunning}
              >
                {isDiagnosticsRunning ? "Checking access..." : "Run access check"}
              </button>
              <p className="sync-status">
                {diagnostics?.lastCheckedAt
                  ? `Last checked: ${formatTimestamp(diagnostics.lastCheckedAt)}`
                  : "Not yet checked."}
              </p>
              {diagnostics?.error && (
                <p className="status-banner">
                  Diagnostics failed: {diagnostics.error.message || "Unknown error"}
                </p>
              )}
              {diagnostics?.checks?.length > 0 && (
                <ul className="sync-diagnostics">
                  {diagnostics.checks.map((check) => (
                    <li key={check.label}>
                      {check.ok ? "✅" : "⚠️"} {check.label}
                      {check.ok ? (
                        <span> — ok ({check.rows} rows)</span>
                      ) : (
                        <span>
                          {" "}
                          — {check.error?.message || "access denied"}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </dd>
          </div>
        </dl>
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

      <div className="settings-card">
        <h2>Install the app</h2>
        <p>
          Save Cookbook Keeper to your home screen for offline access and a
          full-screen experience.
        </p>
        {isInstalled && (
          <p className="status-banner">
            Cookbook Keeper is already installed on this device.
          </p>
        )}
        {!isInstalled && !canInstallApp && (
          <p className="status-banner">{installHelp}</p>
        )}
        {canInstallApp && (
          <button type="button" className="primary" onClick={onInstallApp}>
            Install app
          </button>
        )}
      </div>

      <div className="settings-card">
        <h2>Cookbook artwork</h2>
        <p>
          Upload a cover image for a cookbook or website. The artwork will replace
          the initials anywhere that cookbook appears.
        </p>
        <p className="helper-text">
          Recommended ratio: 16:21 (for example 640 × 840 px). Uploading a new
          image will overwrite the current cover for that cookbook.
        </p>
        {!hasGroup && (
          <p className="status-banner">
            Join a shared group to upload artwork.
          </p>
        )}
        {hasGroup && cookbookOptions.length === 0 && (
          <p className="status-banner">
            Add a recipe with a cookbook title to enable artwork uploads.
          </p>
        )}
        <form className="cover-upload-form" onSubmit={handleCoverUpload}>
          <label htmlFor="cookbook-cover-target">Cookbook or website</label>
          <select
            id="cookbook-cover-target"
            value={selectedCookbook}
            onChange={(event) => setSelectedCookbook(event.target.value)}
            disabled={!hasGroup || cookbookOptions.length === 0}
          >
            <option value="">Select a cookbook</option>
            {cookbookOptions.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
          <label htmlFor="cookbook-cover-file">Cover image</label>
          <input
            key={fileInputKey}
            id="cookbook-cover-file"
            type="file"
            accept="image/*"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            disabled={!hasGroup || cookbookOptions.length === 0}
          />
          {selectedCover && (
            <div className="cover-preview">
              <span>Current cover</span>
              <img src={selectedCover} alt={`${selectedCookbook} cover`} />
            </div>
          )}
          {uploadError && <p className="error-text">{uploadError}</p>}
          {uploadStatus && <p className="status-banner">{uploadStatus}</p>}
          <button
            className="primary"
            type="submit"
            disabled={
              !hasGroup ||
              cookbookOptions.length === 0 ||
              isUploading ||
              !selectedCookbook ||
              !selectedFile
            }
          >
            {isUploading ? "Uploading..." : "Upload artwork"}
          </button>
        </form>
      </div>

      <div className="settings-card danger-card">
        <h2>Log out</h2>
        <p>
          Log out of this group to clear local recipes, logs, and filters. Your
          shared data stays safe and is not deleted.
        </p>
        <button type="button" className="secondary danger" onClick={onLogout}>
          Log out and clear local data
        </button>
      </div>
    </section>
  );
};
