export function Button({ id, label, icon, onClick }) {
  const button = document.createElement("button");
  button.id = id;
  button.className = "toolbar-button";
  button.title = label;
  button.innerHTML = `<img src="/icons/${icon}" alt="${label}" style="width: 24px; height: 24px;" />`;

  button.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-size: 13px;
    background: rgba(255, 255, 255, 0.08);
    color: white;
    padding: 12px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    transition: background 0.3s, transform 0.2s;
  `;

  button.addEventListener("click", onClick);

  return button;
}
