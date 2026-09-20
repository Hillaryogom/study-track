import {
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { DailyStudyPoint } from "../../types/domain";
import { formatDuration, formatShortDate, minutesToHours } from "../../utils/dates";

// Only the pieces a bar chart needs are registered, keeping the bundle small.
Chart.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface WeeklyStudyChartProps {
  points: DailyStudyPoint[];
}

const OPTIONS: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => formatDuration(Math.round((context.parsed.y as number) * 60)),
      },
    },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#5b6784" } },
    y: {
      beginAtZero: true,
      ticks: { color: "#5b6784", callback: (value) => `${value}h` },
      grid: { color: "#eef1f7" },
    },
  },
};

export function WeeklyStudyChart({ points }: WeeklyStudyChartProps) {
  const data = {
    labels: points.map((point) => point.label),
    datasets: [
      {
        label: "Hours studied",
        data: points.map((point) => minutesToHours(point.minutes)),
        backgroundColor: "#3157e8",
        hoverBackgroundColor: "#2242c4",
        borderRadius: 6,
        maxBarThickness: 46,
      },
    ],
  };

  return (
    <div>
      <div className="chart-frame">
        <Bar data={data} options={OPTIONS} aria-label="Study time for the last seven days" role="img" />
      </div>
      {/* Text equivalent so the same information is available without the canvas. */}
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
