import WhatIfSimulator from "@/components/WhatIfSimulator";

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-blue-600">Smart Attendance</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500">Student Portal</span>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Attendance Overview Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-medium text-slate-700">Overall Attendance</h2>
            <div className="mt-4 flex items-baseline text-4xl font-extrabold text-slate-900">
              82<span className="text-xl font-medium text-slate-500 ml-1">%</span>
            </div>
            <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '82%' }}></div>
            </div>
            <p className="mt-4 text-sm text-slate-500">You are above the 75% minimum threshold.</p>
          </div>

          {/* Quick Actions / What-If Simulator Placeholder */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:col-span-2">
            <h2 className="text-lg font-medium text-slate-700">"What-If" Simulator</h2>
            <p className="mt-2 text-sm text-slate-500">Calculate how many classes you can afford to miss or need to attend.</p>
            
            <div className="mt-6">
              <WhatIfSimulator />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
