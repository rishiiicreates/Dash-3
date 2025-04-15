import { DateRangeOption } from "@/lib/dateUtils";

interface DateRangeSelectorProps {
  dateRange: DateRangeOption;
  setDateRange: (range: DateRangeOption) => void;
}

export default function DateRangeSelector({ dateRange, setDateRange }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1.5">
      <button
        className={`px-3 py-1 rounded-md text-sm font-medium ${
          dateRange === "7d"
            ? "bg-white shadow-sm text-gray-800"
            : "text-gray-600 hover:bg-gray-200"
        }`}
        onClick={() => setDateRange("7d")}
      >
        Last 7 days
      </button>
      <button
        className={`px-3 py-1 rounded-md text-sm font-medium ${
          dateRange === "30d"
            ? "bg-white shadow-sm text-gray-800"
            : "text-gray-600 hover:bg-gray-200"
        }`}
        onClick={() => setDateRange("30d")}
      >
        Last 30 days
      </button>
      <button
        className={`px-3 py-1 rounded-md text-sm font-medium ${
          dateRange === "custom"
            ? "bg-white shadow-sm text-gray-800"
            : "text-gray-600 hover:bg-gray-200"
        }`}
        onClick={() => setDateRange("custom")}
      >
        Custom
      </button>
    </div>
  );
}
