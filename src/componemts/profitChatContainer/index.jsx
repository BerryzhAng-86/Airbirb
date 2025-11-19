import { Tooltip } from 'antd';
import { Container, TooltipTitle, HotArea } from '../../uitles/profitChartCss';
import dayjs from 'dayjs';

const WIDTH = 760;
const HEIGHT = 200;
const PAD = { t: 16, r: 16, b: 32, l: 48 };

/**
 * ProfitChartContainer
 *
 * Lightweight SVG-based bar chart for the hosted dashboard:
 * - X axis: days ago (0–30, where 0 is today)
 * - Y axis: cumulative profit based on booking start date
 * - Uses invisible overlay rectangles to drive AntD tooltips.
 */
export default function ProfitChartContainer({ series }) {
  const width = WIDTH;
  const height = HEIGHT;
  const pad = PAD;

  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;
  const n = series.length; // expected 31 points
  const maxY = Math.max(
    1,
    Math.ceil(Math.max(...series.map((v) => v.amount)))
  );
  const barGap = 2;
  const barWidth = Math.max(1, Math.floor((w - (n - 1) * barGap) / n));
  const minWidth = Math.max(barWidth, 8);
  const translateX = barWidth < 8 ? -(8 - barWidth) / 2 : undefined;

  const xOf = (i) => pad.l + i * (barWidth + barGap);
  const yOf = (val) => pad.t + h - (val / maxY) * h;

  const ticks = [0, 5, 10, 15, 20, 25, 30];
  const today = dayjs().startOf('day');
  const dateOf = (i) =>
    today.subtract(i, 'day').format('YYYY-MM-DD');
  const money = (n) =>
    '$' +
    (Number(n) || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });

  return (
    <Container>
      {/* Static SVG background + bars (do not capture mouse events) */}
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="Past 30 days profit"
        style={{ pointerEvents: 'none' }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = pad.t + h - t * h;
          return (
            <line
              key={i}
              x1={pad.l}
              y1={y}
              x2={width - pad.r}
              y2={y}
              stroke="#f0f0f0"
            />
          );
        })}
        <line
          x1={pad.l}
          y1={pad.t + h}
          x2={width - pad.r}
          y2={pad.t + h}
          stroke="#d0d0d0"
        />
        <line
          x1={pad.l}
          y1={pad.t}
          x2={pad.l}
          y2={pad.t + h}
          stroke="#d0d0d0"
        />

        {series.map((pt, i) => {
          const x = xOf(i);
          const y = yOf(pt.amount);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={pad.t + h - y}
              fill="#1677ff"
            />
          );
        })}

        {ticks.map((t) => {
          const x = xOf(t) + barWidth / 2;
          const y = pad.t + h;
          return (
            <g key={t}>
              <line
                x1={x}
                y1={y}
                x2={x}
                y2={y + 4}
                stroke="#999"
              />
              <text
                x={x}
                y={y + 18}
                fontSize="10"
                fill="#666"
                textAnchor="middle"
              >
                {t}
              </text>
            </g>
          );
        })}

        <text
          x={8}
          y={pad.t + 10}
          fontSize="10"
          fill="#666"
        >
          ${maxY}
        </text>
        <text
          x={8}
          y={pad.t + h}
          fontSize="10"
          fill="#666"
        >
          $0
        </text>
        <text
          x={pad.l}
          y={12}
          fontSize="12"
          fill="#333"
          textAnchor="start"
          fontWeight="600"
        >
          Cumulative profit by booking start date (X: days ago / Y:
          cumulative $)
        </text>
      </svg>

      {/* Transparent interactive overlay + Tooltip (capture mouse events) */}
      {series.map((pt, i) => {
        const x = xOf(i);
        const y = yOf(pt.amount);
        const prev = i < 30 ? series[i + 1].amount : 0;
        const delta = Math.max(0, pt.amount - prev);

        return (
          <Tooltip
            key={i}
            title={
              <TooltipTitle>
                <div>
                  <b>{dateOf(i)}</b>
                </div>
                <div>Cumulative: {money(pt.amount)}</div>
                <div>New today: {money(delta)}</div>
              </TooltipTitle>
            }
            placement="top"
            mouseEnterDelay={0.05}
            getPopupContainer={(node) => node.parentElement}
          >
            <HotArea
              $left={x}
              $top={y}
              $width={barWidth}
              $height={pad.t + h - y}
              $minWidth={minWidth}
              $translateX={translateX}
            />
          </Tooltip>
        );
      })}
    </Container>
  );
}
