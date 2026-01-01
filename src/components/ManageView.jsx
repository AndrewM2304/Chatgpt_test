import { useState } from "react";
import { SUPABASE_SETUP_SQL } from "../data/supabaseSetup";

export const ManageView = ({
  editingId,
  formData,
  onFormChange,
  onSaveRecipe,
  onResetForm,
  cookbookOptions,
  cuisineOptions,
  recipes,
  onOpenRecipe,
  onEditRecipe,
  onStartLog,
  onDeleteRecipe,
  onExport,
  onImport,
  syncStatus,
  inviteUrl,
  onCreateInvite,
  onCopyInvite,
  onCreateGroup,
  adminPasswordHash,
  onSetAdminPassword,
  onRunAdminSql,
}) => {
  const [adminPassword, setAdminPassword] = useState("");
  const [adminConfirm, setAdminConfirm] = useState("");
  const [adminRunPassword, setAdminRunPassword] = useState("");
  const [adminSql, setAdminSql] = useState(SUPABASE_SETUP_SQL);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminError, setAdminError] = useState("");
  const [isAdminWorking, setIsAdminWorking] = useState(false);

  const handleAdminPasswordSubmit = async (event) => {
    event.preventDefault();
    setAdminMessage("");
    setAdminError("");

    if (!adminPassword.trim()) {
      setAdminError("Enter an admin password to continue.");
      return;
    }
    if (adminPassword !== adminConfirm) {
      setAdminError("Passwords do not match.");
      return;
    }

    setIsAdminWorking(true);
    const ok = await onSetAdminPassword(adminPassword);
    setIsAdminWorking(false);

    if (ok) {
      setAdminPassword("");
      setAdminConfirm("");
      setAdminMessage("Admin password saved.");
    } else {
      setAdminError("Unable to save admin password.");
    }
  };

  const handleAdminSqlSubmit = async (event) => {
    event.preventDefault();
    setAdminMessage("");
    setAdminError("");

    if (!adminRunPassword.trim()) {
      setAdminError("Enter the admin password to run SQL.");
      return;
    }

    setIsAdminWorking(true);
    const result = await onRunAdminSql({
      sql: adminSql,
      password: adminRunPassword,
    });
    setIsAdminWorking(false);

    if (result.ok) {
      setAdminMessage("SQL executed successfully.");
    } else {
      setAdminError(result.error || "Failed to execute SQL.");
    }
  };

  return (
    <section className="manage">
    <div className="manage-form">
      <h2>{editingId ? "Edit recipe" : "Add a recipe"}</h2>
      <form onSubmit={onSaveRecipe}>
        <label htmlFor="recipe-name">Recipe name</label>
        <input
          id="recipe-name"
          type="text"
          value={formData.name}
          onChange={onFormChange("name")}
          placeholder="Creamy lemon pasta"
        />

        <label htmlFor="cookbook">Cookbook title</label>
        <input
          id="cookbook"
          type="text"
          list="cookbook-options"
          value={formData.cookbookTitle}
          onChange={onFormChange("cookbookTitle")}
          placeholder="Sunday Suppers"
        />
        <datalist id="cookbook-options">
          {cookbookOptions.map((title) => (
            <option key={title} value={title} />
          ))}
        </datalist>

        <label htmlFor="page">Page</label>
        <input
          id="page"
          type="text"
          value={formData.page}
          onChange={onFormChange("page")}
          placeholder="112"
        />

        <label htmlFor="cuisine">Cuisine</label>
        <input
          id="cuisine"
          type="text"
          list="cuisine-options"
          value={formData.cuisine}
          onChange={onFormChange("cuisine")}
          placeholder="Italian"
        />
        <datalist id="cuisine-options">
          {cuisineOptions.map((title) => (
            <option key={title} value={title} />
          ))}
        </datalist>

        <div className="form-actions">
          <button className="primary" type="submit">
            {editingId ? "Save changes" : "Add recipe"}
          </button>
          {editingId && (
            <button type="button" className="ghost" onClick={onResetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>

    <div className="manage-list">
      <h2>Saved recipes</h2>
      {recipes.length ? (
        <ul>
          {recipes
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((recipe) => (
              <li key={recipe.id}>
                <div>
                  <strong>{recipe.name}</strong>
                  <span>
                    {recipe.cookbookTitle || "No cookbook"}
                    {recipe.page ? ` · Page ${recipe.page}` : ""}
                  </span>
                </div>
                <div className="row-actions">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => onOpenRecipe(recipe)}
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => onEditRecipe(recipe)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => onStartLog(recipe.id)}
                  >
                    Log
                  </button>
                  <button
                    type="button"
                    className="ghost danger"
                    onClick={() => onDeleteRecipe(recipe.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
        </ul>
      ) : (
        <p className="empty">No recipes saved yet.</p>
      )}

      <div className="share-card">
        <h3>Share & sync</h3>
        <p>
          Supabase keeps this cookbook synced. Share an invite link to let others
          collaborate. Local exports are still available for backups.
        </p>
        <div className="invite-actions">
          <button type="button" className="primary" onClick={onCreateInvite}>
            Generate invite link
          </button>
          <button type="button" className="ghost" onClick={onCopyInvite}>
            Copy invite link
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
        <p className="sync-status">{syncStatus}</p>
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

      <div className="setup-card">
        <h3>Supabase setup</h3>
        <p>
          Run this SQL once in the Supabase SQL editor to create the tables used
          by the app and enable the admin SQL console below.
        </p>
        <pre>
          <code>{SUPABASE_SETUP_SQL}</code>
        </pre>
      </div>

      <div className="admin-card">
        <h3>Admin SQL console</h3>
        <p>
          Protect schema updates with an admin password, then apply SQL changes
          directly from the app.
        </p>
        <form className="admin-form" onSubmit={handleAdminPasswordSubmit}>
          <label htmlFor="admin-password">
            {adminPasswordHash
              ? "Update admin password"
              : "Set admin password"}
          </label>
          <input
            id="admin-password"
            type="password"
            value={adminPassword}
            onChange={(event) => setAdminPassword(event.target.value)}
            placeholder="Enter a strong password"
          />
          <input
            type="password"
            value={adminConfirm}
            onChange={(event) => setAdminConfirm(event.target.value)}
            placeholder="Confirm password"
          />
          <button className="primary" type="submit" disabled={isAdminWorking}>
            {adminPasswordHash ? "Update password" : "Save password"}
          </button>
        </form>
        <form className="admin-form" onSubmit={handleAdminSqlSubmit}>
          <label htmlFor="admin-sql">SQL to run</label>
          <textarea
            id="admin-sql"
            rows={8}
            value={adminSql}
            onChange={(event) => setAdminSql(event.target.value)}
          />
          <div className="admin-row">
            <input
              type="password"
              value={adminRunPassword}
              onChange={(event) => setAdminRunPassword(event.target.value)}
              placeholder="Admin password"
            />
            <button className="primary" type="submit" disabled={isAdminWorking}>
              Run SQL
            </button>
          </div>
          {(adminMessage || adminError) && (
            <p className={adminError ? "error-text" : "success-text"}>
              {adminError || adminMessage}
            </p>
          )}
        </form>
      </div>
    </div>
    </section>
  );
};
