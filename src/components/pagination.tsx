import Link from "next/link";
import { Icon } from "@/components/icons";

export function Pagination({
  page,
  pageCount,
  hrefFor
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  const numbers = [...new Set([1, page - 1, page, page + 1, pageCount])]
    .filter((value) => value >= 1 && value <= pageCount)
    .sort((a, b) => a - b);

  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? (
        <Link className="pagination__link" href={hrefFor(page - 1)} aria-label="Previous page" rel="prev">
          <Icon name="i-chevron-down" className="pagination__prev" />
        </Link>
      ) : (
        <span className="pagination__link is-disabled" aria-disabled="true">
          <Icon name="i-chevron-down" className="pagination__prev" />
        </span>
      )}

      {numbers.map((value, index) => {
        const previous = numbers[index - 1];
        const gap = previous !== undefined && value - previous > 1;
        return (
          <span className="pagination__group" key={value}>
            {gap ? <span className="pagination__gap">…</span> : null}
            {value === page ? (
              <span className="pagination__link is-active" aria-current="page">
                {value}
              </span>
            ) : (
              <Link className="pagination__link" href={hrefFor(value)} aria-label={`Page ${value}`}>
                {value}
              </Link>
            )}
          </span>
        );
      })}

      {page < pageCount ? (
        <Link className="pagination__link" href={hrefFor(page + 1)} aria-label="Next page" rel="next">
          <Icon name="i-chevron-down" />
        </Link>
      ) : (
        <span className="pagination__link is-disabled" aria-disabled="true">
          <Icon name="i-chevron-down" />
        </span>
      )}
    </nav>
  );
}
