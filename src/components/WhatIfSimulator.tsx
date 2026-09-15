"use client";

import { useState } from "react";

export default function WhatIfSimulator() {
  const [attended, setAttended] = useState(30);
  const [total, setTotal] = useState(40);
  const [plannedAbsences, setPlannedAbsences] = useState(0);

  const targetPercentage = 75;
  const currentPercentage = total > 0 ? (attended / total) * 100 : 0;
  
  const projectedTotal = total + plannedAbsences;
  const projectedPercentage = projectedTotal > 0 ? (attended / projectedTotal) * 100 : 0;
  
  // Calculate how many more classes needed to reach 75% if currently below
  let classesNeededToCatchUp = 0;
  if (currentPercentage < targetPercentage) {
    // Formula: (attended + X) / (total + X) = 0.75
    // attended + X = 0.75 * total + 0.75 * X
    // 0.25 * X = 0.75 * total - attended
    // X = 3 * total - 4 * attended
    classesNeededToCatchUp = Math.max(0, Math.ceil(3 * total - 4 * attended));
  }

  // Calculate how many classes can be missed while staying above 75%
  let safeToMiss = 0;
  if (currentPercentage >= targetPercentage) {
    // Formula: attended / (total + X) = 0.75
    // attended = 0.75 * total + 0.75 * X
    // X = (attended - 0.75 * total) / 0.75
    safeToMiss = Math.floor((attended - 0.75 * total) / 0.75);
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-medium text-slate-500 mb-1">Classes Attended</label>
          <input 
            type="number" 
            min="0"
            value={attended}
            onChange={(e) => setAttended(Math.min(total, parseInt(e.target.value) || 0))}
            className="w-full text-2xl font-bold text-slate-900 focus:outline-none focus:text-blue-600"
          />
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <label className="block text-sm font-medium text-slate-500 mb-1">Total Classes</label>
          <input 
            type="number" 
            min={attended}
            value={total}
            onChange={(e) => setTotal(Math.max(attended, parseInt(e.target.value) || 0))}
            className="w-full text-2xl font-bold text-slate-900 focus:outline-none focus:text-blue-600"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
        <h3 className="font-semibold text-blue-900">Scenario Analysis</h3>
        
        {currentPercentage >= targetPercentage ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-blue-800">
              You are currently at <strong>{currentPercentage.toFixed(1)}%</strong>. 
              You can safely miss <strong>{safeToMiss}</strong> consecutive classes before dropping below 75%.
            </p>
            
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                What if I miss <span className="font-bold text-blue-900 bg-white px-2 py-0.5 rounded-md mx-1">{plannedAbsences}</span> more classes?
              </label>
              <input 
                type="range" 
                min="0" 
                max="20" 
                value={plannedAbsences}
                onChange={(e) => setPlannedAbsences(parseInt(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            
            {plannedAbsences > 0 && (
              <div className={`p-4 rounded-lg flex items-center justify-between ${projectedPercentage >= targetPercentage ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                <span className="font-medium">Projected Attendance:</span>
                <span className="text-xl font-bold">{projectedPercentage.toFixed(1)}%</span>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 p-4 bg-red-100 rounded-lg text-red-800">
            <p className="font-medium text-lg">Warning: Debarment Risk</p>
            <p className="text-sm mt-1">
              You are at <strong>{currentPercentage.toFixed(1)}%</strong>. You need to attend <strong>{classesNeededToCatchUp}</strong> consecutive classes without missing any to reach 75%.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
