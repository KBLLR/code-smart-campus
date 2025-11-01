export class ScrollBoxModal {
  constructor({
    title = "",
    subtitle = "",
    searchable = false,
    onSearch = null,
    content = "",
    closeText = "Close",
  }) {
    this.modal = document.createElement("div");
    this.modal.className = "scrollbox-modal";
    this.modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      height: 80%;
      background: white;
      color: black;
      border-radius: 12px;
      box-shadow: 0 0 40px rgba(0, 0, 0, 0.4);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    const header = document.createElement("div");
    header.style.cssText = `
      flex: 0 0 auto;
      padding: 24px;
      border-bottom: 1px solid #eee;
      background: white;
      position: sticky;
      top: 0;
      z-index: 1;
    `;
    if (title) header.innerHTML = `<h2>${title}</h2><p>${subtitle}</p>`;

    if (searchable) {
      const search = document.createElement("input");
      search.type = "text";
      search.placeholder = "Search...";
      search.style.cssText = `
        margin-top: 12px;
        padding: 8px 12px;
        font-size: 16px;
        width: 100%;
        border-radius: 8px;
        border: 1px solid #ccc;
      `;
      search.oninput = () => {
        if (onSearch) onSearch(search.value);
      };
      header.appendChild(search);
    }

    this.list = document.createElement("div");
    this.list.className = "scrollbox-content";
    this.list.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      font-family: monospace;
    `;
    if (content) this.list.innerHTML = content;

    const footer = document.createElement("div");
    footer.style.cssText = `
      flex: 0 0 auto;
      padding: 12px;
      border-top: 1px solid #eee;
      background: white;
      display: flex;
      justify-content: center;
    `;

    const closeBtn = document.createElement("button");
    closeBtn.textContent = closeText;
    closeBtn.style.cssText = `
      padding: 8px 16px;
      font-size: 16px;
      border: none;
      border-radius: 8px;
      background: #eee;
      cursor: pointer;
    `;
    closeBtn.onclick = () => (this.modal.style.display = "none");
    footer.appendChild(closeBtn);

    this.modal.appendChild(header);
    this.modal.appendChild(this.list);
    this.modal.appendChild(footer);
    document.body.appendChild(this.modal);
  }

  show() {
    this.modal.style.display = "flex";
  }

  hide() {
    this.modal.style.display = "none";
  }

  setContent(html) {
    this.list.innerHTML = html;
  }
}
