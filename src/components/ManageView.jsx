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
}) => (
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
          by the app.
        </p>
        <pre>
          <code>{SUPABASE_SETUP_SQL}</code>
        </pre>
      </div>
    </div>
  </section>
);
