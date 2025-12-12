import React from "react";

export default function PomodoroCard() {
  return (
    <div className="rounded-2xl p-4 bg-white dark:bg-[#121318] shadow-md">
      <h4 className="font-semibold mb-2">Focus Timer</h4>
      <div className="flex items-center justify-center">
        <div className="w-40 h-40 rounded-full bg-gray-100 dark:bg-[#0b0f15] flex items-center justify-center text-4xl font-medium">
          25:00
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="flex-1 py-2 rounded-lg bg-accent text-white">Start</button>
        <button className="flex-1 py-2 rounded-lg border border-gray-200 dark:border-gray-700">Reset</button>
      </div>
    </div>
  );
}
