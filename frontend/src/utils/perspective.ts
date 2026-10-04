import React from "react";

export type Point = [number, number];

function solve8x8(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];

    const div = M[col][col] || 1;
    for (let j = col; j <= n; j++) M[col][j] /= div;

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      for (let j = col; j <= n; j++) M[r][j] -= f * M[col][j];
    }
  }
  return M.map((row) => row[n]);
}

export function getPerspectiveMatrix(
  src: [Point, Point, Point, Point],
  dst: [Point, Point, Point, Point]
): string {
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const [sx, sy] = src[i];
    const [dx, dy] = dst[i];
    A.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    b.push(dx);
    A.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    b.push(dy);
  }

  const [a, bb, c, d, e, f, g, h] = solve8x8(A, b);

  return `matrix3d(${[
    a,  d,  0,  g,
    bb, e,  0,  h,
    0,  0,  1,  0,
    c,  f,  0,  1,
  ].join(",")})`;
}

export function usePerspectiveTransform(
  corners: [Point, Point, Point, Point],
  srcW: number,
  srcH: number
) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [matrix, setMatrix] = React.useState<string>("");

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;

      const px: [Point, Point, Point, Point] = corners.map(
        ([x, y]) => [(x / 100) * w, (y / 100) * h]
      ) as [Point, Point, Point, Point];

      setMatrix(
        getPerspectiveMatrix(
          [
            [0, 0],
            [srcW, 0],
            [srcW, srcH],
            [0, srcH],
          ],
          px
        )
      );
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [corners, srcW, srcH]);

  return { ref, matrix };
}
