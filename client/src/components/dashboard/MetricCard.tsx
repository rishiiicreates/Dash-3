import { formatNumber } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  growthPercent: number;
  icon: string;
  iconColor: string;
}

export default function MetricCard({
  title,
  value,
  growthPercent,
  icon,
  iconColor
}: MetricCardProps) {
  const isPositiveGrowth = growthPercent >= 0;
  const growthColorClass = isPositiveGrowth ? "text-success" : "text-error";
  const growthIcon = isPositiveGrowth ? "ri-arrow-up-line" : "ri-arrow-down-line";
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{formatNumber(value)}</h3>
          <div className={`flex items-center mt-1 ${growthColorClass}`}>
            <i className={`${growthIcon} text-sm`}></i>
            <span className="text-xs font-medium">{Math.abs(growthPercent).toFixed(1)}%</span>
          </div>
        </div>
        <div className={`p-2 bg-opacity-10 rounded-lg`} style={{ backgroundColor: `${iconColor}20` }}>
          <i className={`${icon} text-xl`} style={{ color: iconColor }}></i>
        </div>
      </div>
    </div>
  );
}
