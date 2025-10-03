import React, { useState } from "react";
import { useBorrow } from "../../../context/BorrowContext";
import Loading from "../../../components/Comon/Loading";
import { normalizeAuthors, normalizeUserName } from "../../../utils/bookUtils";

const PendingRequests = () => {
  const { myRequests, loading, fetchAllBorrowData, deleteBorrowRequest } = useBorrow();
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });

  console.log("📋 PendingRequests Component:", { 
    myRequests, 
    loading,
    myRequestsLength: myRequests?.length 
  });

  // Filter only pending requests
  const pendingRequests = myRequests.filter((req) => req.status === "pending");
  
  console.log("📋 Filtered Pending Requests:", { 
    pendingRequests, 
    count: pendingRequests.length 
  });

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    
    try {
      setDeletingId(requestId);
      await deleteBorrowRequest(requestId);
      setMessage({ text: "Request cancelled successfully!", type: "success" });
    } catch (err) {
      console.error("Error cancelling request:", err);
      setMessage({ text: err.message || "Failed to cancel request", type: "error" });
    } finally {
      setDeletingId(null);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  if (loading) return <Loading />;

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: "bg-yellow-100 text-yellow-700", text: "⏳ Pending" },
      accepted: { color: "bg-green-100 text-green-700", text: "✓ Accepted" },
      rejected: { color: "bg-red-100 text-red-700", text: "✗ Rejected" },
      returned: { color: "bg-blue-100 text-blue-700", text: "↩️ Returned" },
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-[#BE5985]">
            ⏳ Your Pending Requests
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
          Track the status of borrow requests you've sent
        </p>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Requests List */}
      {pendingRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-xl text-gray-600 mb-2">No pending requests</p>
          <p className="text-gray-500">
            Your pending borrow requests will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => {
            const book = request.bookId;
            const owner = request.ownerId;
            const badge = getStatusBadge(request.status);

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
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-[#BE5985] mb-1">
                          {book?.title || "Unknown Book"}
                        </h3>
                        <p className="text-gray-600">
                          by {normalizeAuthors(book?.authors)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}
                      >
                        {badge.text}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-700">
                        <span className="font-semibold">👤 Owner:</span>
                        <span>{normalizeUserName(owner)}</span>
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

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                      <p className="text-sm text-yellow-800">
                        <span className="font-semibold">⏳ Waiting for approval</span>
                        <br />
                        The book owner will review your request soon
                      </p>
                    </div>

                    {/* Cancel Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleCancelRequest(request._id)}
                        disabled={deletingId === request._id}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {deletingId === request._id ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Cancelling...
                          </>
                        ) : (
                          <>
                            <span>❌</span>
                            Cancel Request
                          </>
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

      {/* All Requests History */}
      {myRequests.length > pendingRequests.length && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            📜 Request History
          </h3>
          <div className="space-y-3">
            {myRequests
              .filter((req) => req.status !== "pending")
              .map((request) => {
                const book = request.bookId;
                const badge = getStatusBadge(request.status);

                return (
                  <div
                    key={request._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-[#FFEDFA] flex items-center justify-center rounded text-2xl">
                        📚
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {book?.title || "Unknown Book"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(request.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}
                    >
                      {badge.text}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingRequests;
