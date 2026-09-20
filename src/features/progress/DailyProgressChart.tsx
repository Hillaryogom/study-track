import { BarElement, CategoryScale, Chart, LinearScale, Tooltip, type ChartOptions } from "chart.js";
import { Bar } from "react-chartjs-2";
import type { DailyStudyPoint } from "../../types/domain";
import { formatDuration, formatShortDate, minutesToHours } from "../../utils/dates";

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface DailyProgressChartProps {
  points: DailyStudyPoint[];
  colour?: string;
  caption: string;
}

const OPTIONS: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (context) => formatDuration(Math.round((context.parsed.y as number) * 60)) },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#5b6784" } },
    y: { beginAtZero: true, ticks: { color: "#5b6784", callback: (value) => `${value}h` }, grid: { color: "#eef1f7" } },
  },
};

export function DailyProgressChart({ points, colour = "#3157e8", caption }: DailyProgressChartProps) {
  const data = {
    labels: points.map((point) => point.label),
    datasets: [
      {
        label: "Hours studied",
        data: points.map((point) => minutesToHours(point.minutes)),
        backgroundColor: colour,
        borderRadius: 6,
        maxBarThickness: 46,
      },
    ],
  };

  return (
    <div>
      <div className="chart-frame">
        <Bar data={data} options={OPTIONS} role="img" aria-label={caption} />
      </div>
      <ul className="chart-readout">
        {points.map((point) => (
          <li key={point.date}>
            <span>{formatShortDate(point.date)}</span>
            <strong>{formatDuration(point.minutes)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
