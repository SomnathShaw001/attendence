export default function FacultyDashboard() {
  // Mock data for today's classes
  const todayClasses = [
    { id: 1, subject: "Data Structures & Algorithms", time: "10:00 AM - 11:30 AM", batch: "CSE-B", status: "Pending" },
    { id: 2, subject: "Operating Systems", time: "01:00 PM - 02:30 PM", batch: "CSE-A", status: "Completed" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">Smart Attendance</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500">Faculty Portal</span>
              <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold">
                PR
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Today's Schedule</h1>
          <div className="text-sm text-slate-500">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
        
        <div className="mt-8 grid gap-6">
          {todayClasses.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 sm:flex sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{cls.subject}</h3>
                  <div className="mt-2 flex items-center text-sm text-slate-500 space-x-4">
                    <span className="flex items-center">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {cls.time}
                    </span>
                    <span className="flex items-center">
                      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Batch {cls.batch}
                    </span>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-4">
                  {cls.status === "Pending" ? (
                    <button className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Mark Attendance
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
