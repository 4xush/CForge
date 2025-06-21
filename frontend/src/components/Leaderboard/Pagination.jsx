const Pagination = ({ page, totalCount, limit, setPage }) => {
    const totalPages = Math.ceil(totalCount / limit);
    return (
        <div className="flex justify-between items-center ">
            <button
                disabled={page <= 1}
                className="bg-gray-800 px-3 py-1 rounded text-sm"
                onClick={() => setPage(page - 1)}
            >
                Previous
            </button>
            <span className="text-xs">{`Page ${page} of ${totalPages}`}</span>
            <button
                disabled={page >= totalPages}
                className="bg-gray-800 px-3 py-1 rounded text-sm"
                onClick={() => setPage(page + 1)}
            >
                Next
            </button>
        </div>
    );
};

export default Pagination;