import React from 'react';
import { Space } from 'antd';

/**
 * Single star component that supports partial fill based on percentage
 * @param {Object} props
 * @param {number} [props.percent=0] - How much of the star is filled (0–100)
 * @param {number} [props.size=18] - Width/height of the star in pixels
 */
function Star({ percent = 0, size = 18 }) {
  // Star width/height
  const w = size;
  const h = size;

  // Unique ID for the clipPath so multiple stars don't conflict
  const id = React.useId();

  // Raw SVG path for a star (24x24 viewBox)
  const d =
    'M12 .587l3.668 7.431 8.207 1.193-5.938 5.79 1.401 8.164L12 19.771l-7.338 3.894 1.401-8.164L.125 9.211l8.207-1.193L12 .587z';

  // Scale the original 24x24 star to the requested size
  const scale = size / 24;
  const transform = `translate(0,0) scale(${scale})`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        {/* Use a clipping rectangle to control how much of the star is filled */}
        <clipPath id={`${id}-clip`}>
          <rect x="0" y="0" width={(percent / 100) * w} height={h} />
        </clipPath>
      </defs>

      {/* Background star (empty) */}
      <g transform={transform}>
        <path d={d} fill="#e5e7eb" />
      </g>

      {/* Foreground star (filled), clipped by the percentage rectangle */}
      <g transform={transform} clipPath={`url(#${id}-clip)`}>
        <path d={d} fill="#f59e0b" />
      </g>
    </svg>
  );
}

/**
 * Star rating component that shows up to 5 stars with partial fills
 * @param {Object} props
 * @param {number} [props.value=0] - Rating value between 0 and 5
 * @param {number} [props.size=16] - Size of each star in pixels
 */
export function StarRating({ value = 0, size = 16 }) {
  // Ensure the rating is a number between 0 and 5
  const safe = Math.max(0, Math.min(5, Number(value) || 0));

  // For each star, compute how much it should be filled (0–100%)
  const percents = new Array(5).fill(0).map((_, i) => {
    const remain = safe - i;
    if (remain >= 1) return 100; // full star
    if (remain <= 0) return 0;   // empty star
    return Math.round(remain * 100); // partial star
  });

  return (
    <Space size={4} align="center">
      {percents.map((p, i) => (
        <Star key={i} percent={p} size={size} />
      ))}
    </Space>
  );
}
