import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cx } from "@/lib/cx";

export type Column<T> = {
  key: keyof T & string;
  header: string;
  numeric?: boolean;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  width?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  caption,
  rowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  caption: string;
  rowKey: (row: T) => string;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const res = typeof av === "number" && typeof bv === "number"
        ? av - bv
        : String(av).localeCompare(String(bv));
      return sort.dir === "asc" ? res : -res;
    });
    return copy;
  }, [rows, sort]);

  return (
    <div className="overflow-x-auto border border-line rounded-[var(--r)] bg-surface">
      <table className="w-full border-collapse text-[0.875rem]">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 z-10 bg-surface-2 panel-shadow">
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  style={{ width: c.width }}
                  aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"}
                  className={cx("text-caption px-3 py-2", c.numeric ? "text-right" : "text-left")}
                >
                  {c.sortable ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSort((s) =>
                          s && s.key === c.key
                            ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" }
                            : { key: c.key, dir: "asc" },
                        )
                      }
                      className={cx(
                        "inline-flex items-center gap-1 text-caption hover:text-ink",
                        c.numeric && "flex-row-reverse",
                      )}
                    >
                      {c.header}
                      {active ? (
                        sort!.dir === "asc" ? (
                          <ChevronUp className="size-3" aria-hidden />
                        ) : (
                          <ChevronDown className="size-3" aria-hidden />
                        )
                      ) : null}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={rowKey(row)} className={cx("border-t border-line", i % 2 === 1 && "bg-surface-2/60")}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cx("px-3 py-2 align-middle", c.numeric ? "text-right num" : "text-left")}
                >
                  {c.render ? c.render(row) : String(row[c.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
