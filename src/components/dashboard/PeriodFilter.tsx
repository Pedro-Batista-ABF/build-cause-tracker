
interface PeriodFilterProps {
  activePeriod: string;
  onPeriodChange: (period: string) => void;
  periods: string[];
}

export function PeriodFilter({ activePeriod, onPeriodChange, periods }: PeriodFilterProps) {
  return (
    <div className="flex space-x-2 pb-2">
      {periods.map(period => (
        <button
          key={period}
          className={`filter-button ${
            activePeriod === period ? "filter-button-active" : "filter-button-inactive"
          }`}
          onClick={() => onPeriodChange(period)}
        >
          {period}
        </button>
      ))}
    </div>
  );
}
