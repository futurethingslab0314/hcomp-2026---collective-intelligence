export const THEME_COLORS = {
  blue: '#fce874',
  purple: '#b31229', 
  teal: '#ffb0bc',
  background: '#E81B39',
};

// Helper function to convert Hex to RGBA for Canvas
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const CANVAS_SETTINGS = {
  particleCount: 60,
  connectionDistance: 150,
  particleColor: hexToRgba(THEME_COLORS.teal, 0.5),
  lineColor: hexToRgba(THEME_COLORS.purple, 0.3),
  mouseLineColor: hexToRgba(THEME_COLORS.blue, 0.5),
};
