const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://hotpfzvofjarefbivpcs.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_anJj683VuXOTiJ0oRhKacQ_t4WcUiQz";

const buildHeaders = (extra = {}) => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
  "Content-Type": "application/json",
  ...extra,
});

const buildFilters = (filters) =>
  filters
    .map((filter) =>
      `${encodeURIComponent(filter.column)}=eq.${encodeURIComponent(
        filter.value
      )}`
    )
    .join("&");

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.action = null;
    this.payload = null;
    this.columns = "*";
    this.returning = null;
  }

  select(columns = "*") {
    if (!this.action) {
      this.action = "select";
    }
    this.columns = columns;
    this.returning = columns;
    return this;
  }

  insert(payload) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, value });
    return this;
  }

  async maybeSingle() {
    const result = await this.execute();
    if (result.error) {
      return result;
    }
    const data = Array.isArray(result.data) ? result.data[0] || null : result.data;
    return { data, error: null };
  }

  async single() {
    const result = await this.execute();
    if (result.error) {
      return result;
    }
    const data = Array.isArray(result.data) ? result.data[0] : result.data;
    return { data, error: null };
  }

  async execute() {
    const filterString = buildFilters(this.filters);
    const query = filterString ? `?${filterString}` : "";
    const url = `${supabaseUrl}/rest/v1/${this.table}`;

    try {
      if (this.action === "select") {
        const selectQuery = filterString
          ? `${query}&select=${encodeURIComponent(this.columns)}`
          : `?select=${encodeURIComponent(this.columns)}`;
        const response = await fetch(`${url}${selectQuery}`, {
          headers: buildHeaders(),
        });
        if (!response.ok) {
          return { data: null, error: await response.json() };
        }
        const data = await response.json();
        return { data, error: null };
      }

      if (this.action === "insert") {
        const response = await fetch(`${url}${query}`, {
          method: "POST",
          headers: buildHeaders({ Prefer: "return=representation" }),
          body: JSON.stringify(this.payload),
        });
        if (!response.ok) {
          return { data: null, error: await response.json() };
        }
        const data = await response.json();
        return { data, error: null };
      }

      if (this.action === "update") {
        const response = await fetch(`${url}${query}`, {
          method: "PATCH",
          headers: buildHeaders({ Prefer: "return=representation" }),
          body: JSON.stringify(this.payload),
        });
        if (!response.ok) {
          return { data: null, error: await response.json() };
        }
        const data = await response.json();
        return { data, error: null };
      }

      return { data: null, error: { message: "Unsupported action" } };
    } catch (error) {
      return { data: null, error };
    }
  }
}

export const supabase = {
  from(table) {
    return new QueryBuilder(table);
  },
};
