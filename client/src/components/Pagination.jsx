import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    // Show first, last, current, and adjacent pages
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    } else if (
      pages[pages.length - 1] !== '...' &&
      (i === currentPage - 2 || i === currentPage + 2)
    ) {
      pages.push('...');
    }
  }

  return (
    <div className="pagination-container">
      {totalItems !== undefined && (
        <span className="pagination-info">
          Page {currentPage} of {totalPages} ({totalItems} total)
        </span>
      )}
      <div className="pagination-controls">
        <button
          className="btn btn-sm btn-outline pagination-btn"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous Page"
        >
          &larr; Prev
        </button>

        {pages.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
              ...
            </span>
          ) : (
            <button
              key={p}
              className={`pagination-num ${currentPage === p ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="btn btn-sm btn-outline pagination-btn"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next Page"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
};

export default Pagination;

