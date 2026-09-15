export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-white">Smart Attendance <span className="text-blue-400 text-sm ml-2 font-normal">Admin Console</span></span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 rounded bg-slate-700 flex items-center justify-center text-slate-300 font-semibold text-sm">
                AD
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex gap-8">
        
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 hidden md:block">
          <nav className="space-y-1">
            <a href="#" className="bg-slate-200 text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
              Overview
            </a>
            <a href="#" className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
              Manage Users
            </a>
            <a href="#" className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
              Subjects & Classes
            </a>
            <a href="#" className="text-slate-600 hover:bg-slate-100 hover:text-slate-900 group flex items-center px-3 py-2 text-sm font-medium rounded-md">
              System Reports
            </a>
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500">Total Students</h3>
              <p className="mt-2 text-3xl font-bold text-slate-900">1,248</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500">Total Faculty</h3>
              <p className="mt-2 text-3xl font-bold text-slate-900">84</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500">Avg. Daily Attendance</h3>
              <p className="mt-2 text-3xl font-bold text-slate-900">88.4%</p>
            </div>
          </div>
          
          <div className="mt-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-medium text-slate-900">Recent Activity</h3>
            </div>
            <ul className="divide-y divide-slate-200">
              <li className="p-6 hover:bg-slate-50">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-slate-900">Attendance marked for Data Structures</p>
                  <p className="text-sm text-slate-500">Just now</p>
                </div>
                <p className="text-sm text-slate-500 mt-1">Prof. Reynolds • CSE-B</p>
              </li>
              <li className="p-6 hover:bg-slate-50">
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-slate-900">New user registered</p>
                  <p className="text-sm text-slate-500">2 hrs ago</p>
                </div>
                <p className="text-sm text-slate-500 mt-1">Admin • Added Alice Smith (Student)</p>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
