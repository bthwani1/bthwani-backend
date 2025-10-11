// src/utils/query.ts
export type ListQuery = {
  q: string;
  page: number;
  perPage: number;
  sort?: Record<string, 1 | -1>;
  filters?: Record<string, any>;
};

export function parseListQuery(raw: any): ListQuery {
  // مرادفات شائعة في المشاريع الحالية:
  // search | q
  // limit | per_page | perPage | pageSize
  // sort=field:asc,created_at:desc
  const q = (raw.q ?? raw.search ?? "").toString().trim();

  const perPageRaw = raw.per_page ?? raw.perPage ?? raw.pageSize ?? raw.limit ?? 20;
  const perPage = Math.min(Math.max(parseInt(perPageRaw, 10) || 20, 1), 100);

  const page = Math.max(parseInt(raw.page, 10) || 1, 1);

  let sort: Record<string, 1 | -1> | undefined;
  if (raw.sort) {
    sort = {};
    const parts = raw.sort.split(","); // ex: "created_at:desc,name:asc"
    for (const p of parts) {
      const [f, d] = p.split(":");
      if (f) sort[f.trim()] = (d || "asc").toLowerCase() === "desc" ? -1 : 1;
    }
  }

  let filters: Record<string, any> | undefined;
  if (raw.filters) {
    try {
      filters = typeof raw.filters === "string" ? JSON.parse(raw.filters) : { ...raw.filters };
    } catch {
      // صيغة مختصرة: "status:active,type:vendor"
      filters = {};
      String(raw.filters)
        .split(",")
        .forEach((kv: string) => {
          const [k, v] = kv.split(":");
          if (k && v) (filters as any)[k.trim()] = v.trim();
        });
    }
  }

  return { q, page, perPage, sort, filters };
}
