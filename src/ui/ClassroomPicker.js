/**
 * ClassroomPicker - UI component for selecting rooms
 * Shows rooms with icons, personalities, and metadata
 */

import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { getRoomPersonality } from '../rooms/roomsMetadata.js';
import { getIcon } from './icons.js';

export class ClassroomPicker extends Interface {
  constructor(roomManager, options = {}) {
    super('.classroom-picker');

    this.roomManager = roomManager;
    this.options = {
      position: options.position || 'top-right',
      ...options,
    };

    this.isOpen = false;
    this.selectedRoom = null;
    this.items = [];

    this.init();
  }

  init() {
    this.element.id = 'classroom-picker';
    this.element.classList.add(`classroom-picker--${this.options.position}`);

    // Toggle Button removed as per user request
    // this.toggleBtn = ...

    // Panel
    this.panel = new Interface('.classroom-picker__panel');
    this.add(this.panel);

    // Header
    this.header = new Interface('.classroom-picker__header');
    this.header.html(`
      <h3>Select a Room</h3>
      <button class="classroom-picker__close" aria-label="Close">×</button>
    `);
    this.header.element.querySelector('.classroom-picker__close').addEventListener('click', () => this.close());
    this.panel.add(this.header);

    // Search
    this.search = new Interface('.classroom-picker__search', 'input');
    this.search.element.type = 'text';
    this.search.element.placeholder = 'Search rooms...';
    this.search.element.addEventListener('input', (e) => this.filterRooms(e.target.value));
    this.panel.add(this.search);

    // List
    this.list = new Interface('.classroom-picker__list');
    this.panel.add(this.list);

    this.populateRooms();

    // Add to DOM (Legacy support)
    document.body.appendChild(this.element);

    console.log('[ClassroomPicker] Initialized (Space.js)');
  }

  populateRooms() {
    const rooms = this.roomManager.getRooms();

    rooms.forEach((room) => {
      const item = new Interface('.classroom-picker__item');
      item.element.dataset.roomId = room.id;

      const personality = getRoomPersonality(room.id);
      const iconSvg = getIcon(room.metadata.icon, 'classroom-picker__item-icon-svg');

      item.html(`
        <div class="classroom-picker__item-icon">${iconSvg}</div>
        <div class="classroom-picker__item-info">
          <div class="classroom-picker__item-name">${room.name}</div>
          <div class="classroom-picker__item-meta">
            <span class="classroom-picker__item-personality">${personality.name}</span>
            ${room.metadata.capacity ? `<span class="classroom-picker__item-capacity">${getIcon('occupancy', 'icon-sm')} ${room.metadata.capacity}</span>` : ''}
          </div>
          <div class="classroom-picker__item-description">${room.metadata.description}</div>
        </div>
        <div class="classroom-picker__item-color" style="background-color: ${room.metadata.color}"></div>
      `);

      item.element.addEventListener('click', () => this.selectRoom(room));
      this.list.add(item);
      this.items.push(item);
    });
  }

  selectRoom(room) {
    console.log('[ClassroomPicker] Room selected:', room.name);

    this.selectedRoom = room;

    // Update UI
    this.items.forEach((item) => {
      if (item.element.dataset.roomId === room.id) {
        item.element.classList.add('classroom-picker__item--selected');
      } else {
        item.element.classList.remove('classroom-picker__item--selected');
      }
    });

    // Tell room manager to select this room
    this.roomManager.selectRoom(room.id);

    // Close picker (optional)
    setTimeout(() => this.close(), 300);

    // Dispatch custom event
    this.element.dispatchEvent(new CustomEvent('classroompicker:roomselect', {
      detail: { room },
      bubbles: true,
    }));
  }

  filterRooms(query) {
    const lowerQuery = query.toLowerCase();

    this.items.forEach((item) => {
      const el = item.element;
      const name = el.querySelector('.classroom-picker__item-name').textContent.toLowerCase();
      const description = el.querySelector('.classroom-picker__item-description').textContent.toLowerCase();
      const personality = el.querySelector('.classroom-picker__item-personality').textContent.toLowerCase();

      const matches = name.includes(lowerQuery) ||
        description.includes(lowerQuery) ||
        personality.includes(lowerQuery);

      el.style.display = matches ? 'flex' : 'none';
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.element.classList.add('classroom-picker--open');
    this.isOpen = true;
    this.element.dispatchEvent(new CustomEvent('classroompicker:open', { bubbles: true }));
  }

  close() {
    this.element.classList.remove('classroom-picker--open');
    this.isOpen = false;
    this.element.dispatchEvent(new CustomEvent('classroompicker:close', { bubbles: true }));
  }

  dispose() {
    this.element?.remove();
    console.log('[ClassroomPicker] Disposed');
  }
}
