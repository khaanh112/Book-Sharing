import React, { useState } from "react";
import { useBorrow } from "../../../context/BorrowContext";
import Loading from "../../../components/Comon/Loading";
import { normalizeAuthors, normalizeUserName } from "../../../utils/bookUtils";
import { showError, showSuccess } from "../../../utils/toastUtils";

const BorrowRequests = () => {
  const { pendingRequests, acceptBorrow, rejectBorrow, loading, fetchAllBorrowData } = useBorrow();
  const [processingId, setProcessingId] = useState(null);

  const handleAccept = async (requestId) => {
    try {
      setProcessingId(requestId);
      await acceptBorrow(requestId);
      showSuccess("Request accepted successfully! 🎉");
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to accept request";
      showError(errorMsg);
      console.error("Error accepting request:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    
    try {
      setProcessingId(requestId);
      await rejectBorrow(requestId);
      showSuccess("Request rejected ❌");
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to reject request";
      showError(errorMsg);
      console.error("Error rejecting request:", err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-[#BE5985]">
            📨 Borrow Requests
          </h2>
          <button
            onClick={fetchAllBorrowData}
            disabled={loading}
            className="px-4 py-2 bg-[#BE5985] text-white rounded-lg hover:bg-[#a04970] transition-colors disabled:opacity-50"
          >
            🔄 Refresh
          </button>
        </div>
        <p className="text-gray-600">
          Manage borrow requests from other users for your books
        </p>
      </div>

      {/* Requests List */}
      {pendingRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-xl text-gray-600 mb-2">No pending requests</p>
          <p className="text-gray-500">
            When someone requests to borrow your books, they'll appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => {
            const book = request.bookId;
            const borrower = request.borrowerId;
            const isProcessing = processingId === request._id;

            return (
              <div
                key={request._id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Book Thumbnail */}
                  <div className="flex-shrink-0">
                    {book?.thumbnail ? (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="w-32 h-44 object-cover rounded-lg shadow"
                      />
                    ) : (
                      <div className="w-32 h-44 bg-[#FFEDFA] flex items-center justify-center rounded-lg">
                        <span className="text-4xl">📚</span>
                      </div>
                    )}
                  </div>

                  {/* Request Info */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-bold text-[#BE5985] mb-1">
                        {book?.title || "Unknown Book"}
                      </h3>
                      <p className="text-gray-600">
                        by {normalizeAuthors(book?.authors)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-semibold">👤 Borrower:</span>
                        <span>{normalizeUserName(borrower)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-semibold">📅 Requested:</span>
                        <span>
                          {new Date(request.requestDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-semibold">⏱️ Duration:</span>
                        <span>{new Date(request.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleAccept(request._id)}
                        disabled={isProcessing}
                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
                      >
                        {isProcessing ? (
                          <>⏳ Processing...</>
                        ) : (
                          <>✓ Accept</>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(request._id)}
                        disabled={isProcessing}
                        className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold flex items-center gap-2"
                      >
                        {isProcessing ? (
                          <>⏳ Processing...</>
                        ) : (
                          <>✗ Reject</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BorrowRequests;
