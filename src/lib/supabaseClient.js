export const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL ||
  "https://hotpfzvofjarefbivpcs.supabase.co";
export const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_anJj683VuXOTiJ0oRhKacQ_t4WcUiQz";

const REQUEST_TIMEOUT_MS = 10000;

const buildHeaders = (extra = {}) => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${supabaseAnonKey}`,
  "Content-Type": "application/json",
  ...extra,
});

const buildFilters = (filters) =>
  filters
    .map((filter) => {
      const operator = filter.operator || "eq";
      return `${encodeURIComponent(filter.column)}=${operator}.${encodeURIComponent(
        filter.value
      )}`;
    })
    .join("&");

const buildQueryString = (filters, columns) => {
  const filterString = buildFilters(filters);
  let query = filterString ? `?${filterString}` : "";
  if (columns) {
    query = `${query ? `${query}&` : "?"}select=${encodeURIComponent(columns)}`;
  }
  return query;
};

const appendQueryParam = (query, key, value) => {
  if (!value) {
    return query;
  }
  return `${query ? `${query}&` : "?"}${encodeURIComponent(
    key
  )}=${encodeURIComponent(value)}`;
};

const parseResponseData = async (response) => {
  if (response.status === 204) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text, error };
  }
};

const normalizeFetchError = (error) => {
  if (error?.name === "AbortError") {
    return {
      name: "TimeoutError",
      message: "Supabase request timed out.",
      isNetworkError: true,
    };
  }
  return {
    ...error,
    message: error?.message || "Unable to reach Supabase.",
    isNetworkError: true,
  };
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return { response, error: null };
  } catch (error) {
    return { response: null, error: normalizeFetchError(error) };
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
};

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.filters = [];
    this.action = null;
    this.payload = null;
    this.columns = "*";
    this.returning = null;
    this.onConflict = null;
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

  upsert(payload, options = {}) {
    this.action = "upsert";
    this.payload = payload;
    this.onConflict = options.onConflict || null;
    return this;
  }

  eq(column, value) {
    this.filters.push({ column, value, operator: "eq" });
    return this;
  }

  ilike(column, value) {
    this.filters.push({ column, value, operator: "ilike" });
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
    const query = buildQueryString(this.filters, this.returning);
    const url = `${supabaseUrl}/rest/v1/${this.table}`;

    try {
      if (this.action === "select") {
        const selectQuery = buildQueryString(this.filters, this.columns);
        const { response, error } = await fetchWithTimeout(
          `${url}${selectQuery}`,
          {
            headers: buildHeaders(),
          }
        );
        if (error) {
          return { data: null, error };
        }
        if (!response.ok) {
          return { data: null, error: await parseResponseData(response) };
        }
        const data = await parseResponseData(response);
        return { data, error: null };
      }

      if (this.action === "insert") {
        const { response, error } = await fetchWithTimeout(`${url}${query}`, {
          method: "POST",
          headers: buildHeaders({ Prefer: "return=representation" }),
          body: JSON.stringify(this.payload),
        });
        if (error) {
          return { data: null, error };
        }
        if (!response.ok) {
          return { data: null, error: await parseResponseData(response) };
        }
        const data = await parseResponseData(response);
        return { data, error: null };
      }

      if (this.action === "update") {
        const { response, error } = await fetchWithTimeout(`${url}${query}`, {
          method: "PATCH",
          headers: buildHeaders({ Prefer: "return=representation" }),
          body: JSON.stringify(this.payload),
        });
        if (error) {
          return { data: null, error };
        }
        if (!response.ok) {
          return { data: null, error: await parseResponseData(response) };
        }
        const data = await parseResponseData(response);
        return { data, error: null };
      }

      if (this.action === "upsert") {
        const upsertQuery = appendQueryParam(query, "on_conflict", this.onConflict);
        const { response, error } = await fetchWithTimeout(
          `${url}${upsertQuery}`,
          {
            method: "POST",
            headers: buildHeaders({
              Prefer: "return=representation, resolution=merge-duplicates",
            }),
            body: JSON.stringify(this.payload),
          }
        );
        if (error) {
          return { data: null, error };
        }
        if (!response.ok) {
          return { data: null, error: await parseResponseData(response) };
        }
        const data = await parseResponseData(response);
        return { data, error: null };
      }

      return { data: null, error: { message: "Unsupported action" } };
    } catch (error) {
      return { data: null, error: normalizeFetchError(error) };
    }
  }
}

export const supabase = {
  from(table) {
    return new QueryBuilder(table);
  },
  async rpc(functionName, payload, options = {}) {
    const { response, error } = await fetchWithTimeout(
      `${supabaseUrl}/rest/v1/rpc/${functionName}`,
      {
        method: "POST",
        headers: buildHeaders(options.headers),
        body: JSON.stringify(payload ?? {}),
      }
    );

    if (error) {
      return { data: null, error };
    }

    if (!response.ok) {
      return { data: null, error: await response.json() };
    }

    const data = await response.json();
    return { data, error: null };
  },
};
