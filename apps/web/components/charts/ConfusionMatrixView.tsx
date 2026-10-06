"use client";

import React from "react";

interface ConfusionMatrixViewProps {
  matrix: number[][];
  classLabels: string[];
  title?: string;
  subtitle?: string;
}

export function ConfusionMatrixView({
  matrix,
  classLabels,
  title,
  subtitle,
}: ConfusionMatrixViewProps) {
  if (!matrix || matrix.length === 0) {
    return <div className="text-xs text-slate-400 p-4">No confusion matrix data available.</div>;
  }

  // Calculate row totals for percentage calculation
  const rowTotals = matrix.map((row) => row.reduce((sum, val) => sum + val, 0));
  const maxVal = Math.max(...matrix.flat(), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      {title && <h4 className="text-sm font-bold text-slate-900">{title}</h4>}
      {subtitle && <p className="text-xs text-slate-500 mb-4">{subtitle}</p>}

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="flex">
            {/* Y-axis label */}
            <div className="w-8 flex items-center justify-center">
              <span className="text-[11px] font-bold text-slate-500 -rotate-90 whitespace-nowrap tracking-wider uppercase">
                Actual
              </span>
            </div>

            <div className="flex-1">
              {/* Header: Predicted labels */}
              <div className="text-center mb-2">
                <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                  Predicted
                </span>
              </div>

              {/* Matrix Grid */}
              <table className="border-collapse mx-auto">
                <thead>
                  <tr>
                    <th className="p-2 text-xs font-semibold text-slate-400"></th>
                    {classLabels.map((lbl, idx) => (
                      <th
                        key={idx}
                        className="p-2 text-xs font-semibold text-slate-700 text-center max-w-[100px] truncate"
                        title={lbl}
                      >
                        {lbl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, rowIdx) => {
                    const rowLabel = classLabels[rowIdx] || `Class ${rowIdx}`;
                    const rowTotal = rowTotals[rowIdx] || 1;

                    return (
                      <tr key={rowIdx}>
                        <td
                          className="p-2 text-xs font-semibold text-slate-700 text-right pr-3 max-w-[100px] truncate"
                          title={rowLabel}
                        >
                          {rowLabel}
                        </td>
                        {row.map((val, colIdx) => {
                          const pct = Math.round((val / rowTotal) * 100);
                          const isDiagonal = rowIdx === colIdx;
                          // Intensity 0..1
                          const intensity = val / maxVal;
                          const bgStyle = isDiagonal
                            ? `rgba(37, 99, 235, ${Math.max(0.08, intensity * 0.85)})` // blue
                            : val > 0
                            ? `rgba(239, 68, 68, ${Math.max(0.06, intensity * 0.6)})` // red for off-diagonal
                            : "#F8FAFC";

                          const textColor =
                            isDiagonal && intensity > 0.45 ? "text-white" : "text-slate-800";

                          return (
                            <td
                              key={colIdx}
                              className="border border-slate-200 p-3 text-center min-w-[70px] transition-colors"
                              style={{ backgroundColor: bgStyle }}
                            >
                              <div className={`text-sm font-bold ${textColor}`}>{val}</div>
                              <div
                                className={`text-[10px] font-medium ${
                                  isDiagonal && intensity > 0.45 ? "text-blue-100" : "text-slate-500"
                                }`}
                              >
                                {pct}%
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
