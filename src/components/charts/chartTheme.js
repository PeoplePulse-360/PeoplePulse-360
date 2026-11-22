// Chart colours from the PeoplePulse 360 design system.
// Names are unchanged so existing chart components keep working.
export const axisTick = { fill: "#777D91", fontSize: 12 }

export const gridStroke = "#E7E9F0"

export const series = {
  blue: "#8C9FD5", // info
  indigo: "#A29BEA", // primary lavender
  emerald: "#68B99A", // success
  amber: "#E8B66F", // warning
  rose: "#E58B9E", // danger
  slate: "#A0A4B2", // muted
  sky: "#B8C0E8", // secondary pale blue
}

// Fourth colour is slightly deeper than the palette's pale blue so legend text stays readable.
export const distributionColors = ["#8F87DC", "#A29BEA", "#8C9FD5", "#9AA6D8"]

// Sentiment stays inside the lavender / blue theme; amber marks the negative slice.
export const sentimentColors = {
  Positive: "#8F87DC",
  Neutral: "#9AA6D8",
  Negative: "#E8B66F",
}