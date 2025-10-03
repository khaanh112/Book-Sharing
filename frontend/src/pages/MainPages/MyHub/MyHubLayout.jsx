import { Outlet, useLocation, Link } from "react-router-dom";

export default function MyHubLayout() {
  const location = useLocation();

  const tabs = [
    { 
      id: "your-books", 
      path: "/my-hub/your-books", 
      label: "Your Books", 
      icon: "📚" 
    },
    { 
      id: "borrow-requests", 
      path: "/my-hub/borrow-requests", 
      label: "Borrow Requests", 
      icon: "📨" 
    },
    { 
      id: "borrowed-books", 
      path: "/my-hub/borrowed-books", 
      label: "Borrowed Books", 
      icon: "📖" 
    },
    { 
      id: "pending-requests", 
      path: "/my-hub/pending-requests", 
      label: "Pending Requests", 
      icon: "⏳" 
    },
    { 
      id: "add-book", 
      path: "/my-hub/add-book", 
      label: "Add Book", 
      icon: "➕" 
    },
  ];

  return (
    <div className="flex flex-1 min-h-[calc(100vh-8rem)] gap-6">
      {/* Sidebar */}
      <aside className="w-64 bg-white rounded-lg shadow-md p-4 flex flex-col gap-2 sticky top-24 h-fit">
        <h1 className="text-2xl font-bold mb-4 text-[#BE5985] flex items-center gap-2">
          <span>🏠</span> My Hub
        </h1>
        <div className="space-y-1">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path || 
                            (tab.path === "/my-hub/your-books" && location.pathname === "/my-hub");
            
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                  isActive
                    ? "bg-gradient-to-r from-[#EC7FA9] to-[#BE5985] text-white shadow-md font-semibold"
                    : "hover:bg-[#FFEDFA] text-gray-700"
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main content scrollable */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}