export function Icon({ src = "unknown", size = 16 }) {
  const icon = document.createElement("img");
  icon.src = `/icons/${src.replace(/\.svg$/, "")}.svg`;
  icon.width = size;
  icon.height = size;
  icon.alt = src;
  return icon;
}
