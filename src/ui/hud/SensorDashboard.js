
import { Interface } from '@alienkitty/space.js/src/utils/Interface.js';
import { SensorConfig } from '../../config/SensorConfig.js';
import { Meter } from '../components/Meter.js';
import { OverviewManager } from './OverviewManager.js';

export class SensorDashboard extends Interface {
    constructor(sensorManager) {
        super('.sensor-dashboard');
        this.sensorManager = sensorManager;
        this.overviewManager = new OverviewManager(sensorManager);
        this.isVisible = false;

        this.currentFilter = 'overview'; // Default to Overview

        this.init();
        this.initViews();
        this.addListeners();

        // Initial update with 'all'
        this.updateInfoPanel('overview');
    }

    init() {
        this.css({
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(5, 5, 8, 0.96)', // Deeper dark
            backdropFilter: 'blur(30px)',
            webkitBackdropFilter: 'blur(30px)',
            zIndex: 200,
            display: 'none',
            opacity: 0,
            pointerEvents: 'none', // Ensure it doesn't block clicks when hidden
            boxSizing: 'border-box'
        });

        document.body.appendChild(this.element);
    }

    initViews() {
        // Main Flex Container
        this.mainContainer = new Interface('.main-container');
        this.mainContainer.css({
            display: 'flex',
            width: '100%',
            height: '100%',
            maxWidth: '1600px', // Wider constraint
            margin: '0 auto'
        });
        this.add(this.mainContainer);

        // --- Left Column (Main Content) 75% ---
        this.leftCol = new Interface('.left-col');
        this.leftCol.css({
            flex: '3',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '60px 40px 40px 40px',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            boxSizing: 'border-box'
        });
        this.mainContainer.add(this.leftCol);

        // Header (Title + Close)
        this.header = new Interface('.dashboard-header');
        this.header.css({
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '40px',
            width: '100%'
        });
        this.leftCol.add(this.header);

        this.title = new Interface('.title');
        this.title.text('Global Sensor Matrix');
        this.title.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '24px',
            fontWeight: '700',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: 'var(--ui-color)'
        });
        this.header.add(this.title);

        this.closeBtn = new Interface('.close-btn');
        this.closeBtn.text('CLOSE');
        this.closeBtn.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '12px',
            letterSpacing: '1.5px',
            cursor: 'pointer',
            padding: '10px 20px',
            border: '1px solid var(--ui-color)',
            borderRadius: '20px',
            color: 'var(--ui-color)',
            transition: 'all 0.3s ease'
        });
        this.header.add(this.closeBtn);

        // Header Controls (Refresh/History)
        this.controls = new Interface('.controls');
        this.controls.css({
            display: 'flex',
            gap: '10px',
            marginRight: '20px'
        });

        // Insert before close button
        this.header.element.insertBefore(this.controls.element, this.closeBtn.element);

        this.refreshBtn = new Interface('.ctrl-btn');
        this.refreshBtn.html('<span class="material-symbols-rounded">refresh</span>');
        this.styleControlBtn(this.refreshBtn);
        this.refreshBtn.element.addEventListener('click', () => this.refreshData());
        this.controls.add(this.refreshBtn);

        this.historyBtn = new Interface('.ctrl-btn');
        this.historyBtn.html('<span class="material-symbols-rounded">show_chart</span>');
        this.styleControlBtn(this.historyBtn);
        this.historyBtn.element.addEventListener('click', () => this.toggleHistory());
        this.controls.add(this.historyBtn);

        // Last Reading Label (Absolute Bottom Right of Main Col)
        this.lastReading = new Interface('.last-reading');
        this.lastReading.css({
            position: 'absolute',
            bottom: '20px',
            right: '40px',
            fontFamily: 'var(--ui-font-family)',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.3)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
        });
        this.leftCol.add(this.lastReading);

        // Filter Bar
        this.filterBar = new Interface('.filter-bar');
        this.filterBar.css({
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '30px',
            width: '100%'
        });
        this.leftCol.add(this.filterBar);

        const filters = ['overview', 'all', 'temperature', 'humidity', 'occupancy', 'power', 'co2', 'battery', 'equipment', 'voc', 'pm25', 'celestial'];
        this.filterButtons = {};

        filters.forEach(filter => {
            const btn = new Interface(`.filter-btn-${filter}`);
            btn.text(filter);
            btn.css({
                fontFamily: 'var(--ui-font-family)',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                padding: '8px 16px',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: filter === this.currentFilter ? 'var(--ui-color)' : 'rgba(255, 255, 255, 0.6)',
                background: filter === this.currentFilter ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                transition: 'all 0.2s ease'
            });

            btn.element.addEventListener('click', () => this.setFilter(filter));
            this.filterBar.add(btn);
            this.filterButtons[filter] = btn;
        });

        // Grid Container
        this.grid = new Interface('.sensor-grid');
        this.grid.css({
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '20px',
            width: '100%',
            overflowY: 'auto',
            paddingBottom: '40px',
            // Hide scrollbar but allow scroll
            scrollbarWidth: 'none'
        });
        this.leftCol.add(this.grid);


        // --- Right Column (Info) 25% ---
        this.rightCol = new Interface('.right-col');
        this.rightCol.css({
            flex: '1',
            height: '100%',
            padding: '60px 40px',
            background: 'rgba(255,255,255,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '30px',
            boxSizing: 'border-box',
            overflowY: 'auto'
        });
        this.mainContainer.add(this.rightCol);

        // Info Content
        this.infoTitle = new Interface('.info-title');
        this.infoTitle.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--ui-color)',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '15px'
        });
        this.rightCol.add(this.infoTitle);

        this.infoDesc = new Interface('.info-desc');
        this.infoDesc.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '14px',
            lineHeight: '1.6',
            color: 'rgba(255,255,255,0.8)'
        });
        this.rightCol.add(this.infoDesc);

        this.resourcesLabel = new Interface('.res-label');
        this.resourcesLabel.text('Standards & Resources');
        this.resourcesLabel.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '12px',
            fontWeight: '700',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            marginTop: '20px'
        });
        this.rightCol.add(this.resourcesLabel);

        this.resourcesList = new Interface('.res-list');
        this.resourcesList.css({
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
        });
        this.rightCol.add(this.resourcesList);
    }

    addListeners() {
        this.closeBtn.element.addEventListener('click', () => this.close());
        this.closeBtn.element.addEventListener('mouseenter', () => {
            this.closeBtn.css({ background: 'var(--ui-color)', color: '#000' });
        });
        this.closeBtn.element.addEventListener('mouseleave', () => {
            this.closeBtn.css({ background: 'transparent', color: 'var(--ui-color)' });
        });
    }

    setFilter(filter) {
        this.currentFilter = filter;

        // Update UI
        Object.entries(this.filterButtons).forEach(([key, btn]) => {
            const active = key === filter;
            btn.css({
                color: active ? 'var(--ui-color)' : 'rgba(255, 255, 255, 0.6)',
                background: active ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                borderColor: active ? 'var(--ui-color)' : 'rgba(255, 255, 255, 0.1)'
            });
        });

        this.renderSensors();
        this.updateInfoPanel(filter);
    }

    open() {
        if (this.isVisible) return;
        this.isVisible = true;
        this.css({ display: 'block', pointerEvents: 'auto' });
        this.tween({ opacity: 1 }, 400, 'easeOutExpo');

        this.renderSensors();
    }

    styleControlBtn(btn) {
        btn.css({
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--ui-color)',
            background: 'transparent',
            transition: 'all 0.2s ease'
        });
        btn.element.addEventListener('mouseenter', () => btn.css({ background: 'rgba(255,255,255,0.1)' }));
        btn.element.addEventListener('mouseleave', () => btn.css({ background: 'transparent' }));
    }

    refreshData() {
        this.renderSensors();
        // Animate refresh icon
        this.refreshBtn.element.querySelector('span').animate([
            { transform: 'rotate(0deg)' },
            { transform: 'rotate(360deg)' }
        ], { duration: 500 });
    }

    toggleHistory() {
        alert('Historical data module construction initiated.');
    }

    close() {
        if (!this.isVisible) return;
        this.isVisible = false;
        // Disable pointer events immediately to allow clicks to pass through during fade out
        this.css({ pointerEvents: 'none' });
        this.tween({ opacity: 0 }, 300, 'easeOutExpo', 0, () => {
            this.css({ display: 'none' });
        });
    }

    renderSensors() {
        this.grid.empty();

        // Switch Grid Mode based on filter
        if (this.currentFilter === 'overview') {
            this.grid.css({ gridAutoFlow: 'dense' });
            this.renderOverview();

            // Update Last Reading
            this.updateLastReading();
            return;
        } else {
            this.grid.css({ gridAutoFlow: 'row' }); // Reset to standard
        }

        const allSensors = this.sensorManager.getDiscoveredSensors();
        let visibleCount = 0;

        allSensors.forEach(sensor => {
            const typeKey = this.sensorManager._detectSensorType(sensor);

            // Special Handling (Battery)
            if (sensor.friendlyName === 'Low Battery devices' || sensor.entityId.includes('low_battery_devices')) {
                // Remove from 'all' view
                if (this.currentFilter === 'all') return;

                // Show special card in 'battery' view
                if (this.currentFilter === 'battery') {
                    this.createBatteryListCard(sensor);
                    visibleCount++;
                    return;
                }
            }

            // Filter logic
            if (this.currentFilter !== 'all' && typeKey !== this.currentFilter) return;

            // Get Config
            const config = SensorConfig.get(typeKey);

            let displayVal;
            // Special handling for non-numeric types or mixed types like Celestial
            if (typeKey === 'celestial' || typeKey === 'occupancy' || typeKey === 'activity' || typeKey === 'equipment') {
                displayVal = config.format(sensor.state);
            } else {
                const fVal = parseFloat(sensor.state);
                displayVal = isNaN(fVal) ? sensor.state : config.format(fVal);
            }

            const valForColor = (typeKey === 'celestial') ? sensor.state : parseFloat(sensor.state);
            const color = config.color(valForColor);

            this.createSensorCard(sensor, config, displayVal, color);
            visibleCount++;
        });

        if (visibleCount === 0) {
            const empty = new Interface('.empty');
            empty.text('No sensors specific to this category found.');
            empty.css({ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', gridColumn: '1/-1' });
            this.grid.add(empty);
        }

        this.updateLastReading();
    }

    updateLastReading() {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = now.toLocaleDateString();
        this.lastReading.text(`Last Reading: ${date} ${time}`);
    }

    renderOverview() {
        const widgets = this.overviewManager.generateWidgets();

        widgets.forEach(widget => {
            this.createOverviewWidget(widget);
        });

        if (widgets.length === 0) {
            const empty = new Interface('.empty');
            empty.text('System Normal. No high priority items.');
            this.grid.add(empty);
        }
    }

    createOverviewWidget(widget) {
        const card = new Interface(`.overview-card.${widget.type}`);

        // Size Mapping
        let colSpan = 1;
        let rowSpan = 1;
        if (widget.size === '2x1') colSpan = 2;
        if (widget.size === '1x2') rowSpan = 2;
        if (widget.size === '2x2') { colSpan = 2; rowSpan = 2; }

        card.css({
            gridColumn: `span ${colSpan}`,
            gridRow: `span ${rowSpan}`,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            position: 'relative',
            overflow: 'hidden'
        });

        // High Relevance Highlight
        if (widget.relevance >= 80) {
            card.css({
                boxShadow: '0 0 30px rgba(248, 113, 113, 0.1)', // Red glow
                border: '1px solid rgba(248, 113, 113, 0.3)'
            });
        }

        // --- Header ---
        const header = new Interface('.widget-header');
        header.css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
        card.add(header);

        const titleGroup = new Interface('.title-group');
        titleGroup.css({ display: 'flex', alignItems: 'center', gap: '10px' });
        header.add(titleGroup);

        // Icon
        const iconConfig = SensorConfig.getDefault(); // Fallback
        // Manual icon map for overview types
        const icons = {
            occupancy: 'groups',
            air_quality: 'air',
            thermal: 'thermostat',
            celestial: 'wb_sunny',
            health: 'health_metrics'
        };

        const iconContainer = new Interface('.icon-bg');
        iconContainer.css({
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ui-color)'
        });
        const icon = new Interface('.icon');
        icon.text(icons[widget.type] || 'circle');
        icon.element.classList.add('material-symbols-rounded');
        icon.css({ fontSize: '20px' });
        iconContainer.add(icon);
        titleGroup.add(iconContainer);

        const title = new Interface('.title');
        title.text(widget.title);
        title.css({
            fontFamily: 'var(--ui-font-family)', fontSize: '14px', fontWeight: '600',
            color: 'rgba(255,255,255,0.9)', letterSpacing: '0.5px'
        });
        titleGroup.add(title);

        // --- Content Rendering Strategy ---
        const content = new Interface('.content');
        content.css({ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' });
        card.add(content);

        // Render based on Type
        if (widget.type === 'occupancy') {
            const count = new Interface('.big-val');
            count.text(widget.data.occupied);
            count.css({ fontSize: '42px', fontWeight: '300', color: '#fff' });
            content.add(count);

            const sub = new Interface('.sub');
            sub.text(`${widget.data.total} Total Rooms`);
            sub.css({ fontSize: '12px', color: 'rgba(255,255,255,0.5)' });
            content.add(sub);

            if (widget.size === '2x2') {
                // Add Graph or List for Hero size
                const detail = new Interface('.detail');
                detail.text('High Occupancy Zones: Makerspace, Kitchen'); // Mock for now
                detail.css({ marginTop: 'auto', fontSize: '12px', color: 'var(--ui-color)' });
                content.add(detail);
            }
        }
        else if (widget.type === 'air_quality') {
            const status = new Interface('.status');
            status.text(widget.data.status);
            const color = widget.data.status === 'Poor' ? '#f87171' : (widget.data.status === 'Fair' ? '#fbbf24' : '#34d399');
            status.css({ fontSize: '24px', fontWeight: '600', color: color });
            content.add(status);

            const sub = new Interface('.sub');
            sub.text(`Max CO2: ${widget.data.maxCO2} ppm`);
            sub.css({ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '5px' });
            content.add(sub);
        }
        else if (widget.type === 'thermal') {
            const val = new Interface('.big-val');
            val.text(`${widget.data.avgTemp}°C`);
            val.css({ fontSize: '36px', fontWeight: '300', color: '#fff' });
            content.add(val);

            const range = new Interface('.range');
            range.text(`Range: ${widget.data.range}`);
            range.css({ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' });
            content.add(range);
        }
        else if (widget.type === 'celestial') {
            // Horizon visual
            const val = new Interface('.val');
            val.text(widget.data.display);
            val.css({ fontSize: '32px', color: '#fbbf24' });
            content.add(val);

            const state = new Interface('.state');
            state.text(widget.data.state.replace(/_/g, ' '));
            state.css({ fontSize: '12px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' });
            content.add(state);
        }
        else if (widget.type === 'health') {
            if (widget.data.lowBatteryCount > 0) {
                const alert = new Interface('.alert');
                alert.text(`${widget.data.lowBatteryCount} Issues`);
                alert.css({ fontSize: '24px', color: '#f87171', fontWeight: 'bold' });
                content.add(alert);

                const sub = new Interface('.sub');
                sub.text('Low Battery Devices');
                sub.css({ fontSize: '12px', color: 'rgba(255,255,255,0.5)' });
                content.add(sub);
            } else {
                const ok = new Interface('.ok');
                ok.text('100% OK');
                ok.css({ fontSize: '24px', color: '#34d399', fontWeight: 'bold' });
                content.add(ok);
            }
        }

        this.grid.add(card);
    }

    createSensorCard(sensor, config, displayVal, color) {
        const card = new Interface('.sensor-card');
        card.css({
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            transition: 'transform 0.2s ease, background 0.2s ease',
            cursor: 'default',
            minHeight: '130px'
        });

        // Hover Effect
        card.element.addEventListener('mouseenter', () => {
            card.css({
                background: 'rgba(255, 255, 255, 0.06)',
                transform: 'translateY(-2px)'
            });
        });
        card.element.addEventListener('mouseleave', () => {
            card.css({
                background: 'rgba(255, 255, 255, 0.03)',
                transform: 'translateY(0)'
            });
        });

        // Header: Icon + Name
        const header = new Interface('.card-header');
        header.css({ display: 'flex', alignItems: 'center', gap: '10px' });
        card.add(header);

        // Icon Circle
        const iconContainer = new Interface('.icon-container');
        iconContainer.css({
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: `rgba(255,255,255,0.05)`, // Subtle bg
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color
        });

        const iconEl = new Interface('.icon');
        // Use config icon directly
        iconEl.text(config.icon || 'circle');
        // Note: sensor config stores 'icon' string. 
        // Updated SensorConfig stores simple names like 'thermometer'.
        // We might need to map them here or ensure config matches the font we have.
        // IMPORTANT: Add class to the underlying DOM element
        iconEl.element.classList.add('material-symbols-rounded');
        iconEl.css({ fontSize: '18px' });

        iconContainer.add(iconEl);
        header.add(iconContainer);

        // Name
        const name = new Interface('.name');
        name.text(sensor.friendlyName || sensor.entityId);
        name.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.8)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%'
        });
        header.add(name);

        // Value Big
        const valueRow = new Interface('.value-row');
        valueRow.css({
            display: 'flex',
            alignItems: 'baseline',
            gap: '4px',
            marginTop: '10px'
        });
        card.add(valueRow);

        const value = new Interface('.value');
        value.text(displayVal);
        value.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '28px',
            fontWeight: '300',
            color: '#fff'
        });
        valueRow.add(value);

        const unit = new Interface('.unit');
        unit.text(sensor.unit || config.unit || '');
        unit.css({
            fontFamily: 'var(--ui-font-family)',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)'
        });
        valueRow.add(unit);

        // Footer / Meta
        const footer = new Interface('.footer');
        footer.css({
            marginTop: 'auto',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'var(--ui-font-family)'
        });

        const idLabel = new Interface('.id');
        idLabel.text(sensor.entityId);
        // Truncate
        idLabel.css({
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        });
        footer.add(idLabel);

        card.add(footer);

        this.grid.add(card);
    }

    createBatteryListCard(sensor) {
        // Special card for aggregated battery list
        // We aggregate client-side because the group sensor attributes might be empty
        const card = new Interface('.sensor-card.battery-list');
        card.css({
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            gridRow: 'span 2', // Make it taller
            minHeight: '300px',
            overflowY: 'auto'
        });

        // Header
        const header = new Interface('.card-header');
        header.css({ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' });
        card.add(header);

        const iconContainer = new Interface('.icon-container');
        iconContainer.css({
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#f87171' // Red for low battery alert
        });
        const iconEl = new Interface('.icon');
        iconEl.text('battery_alert');
        iconEl.element.classList.add('material-symbols-rounded');
        iconEl.css({ fontSize: '18px' });
        iconContainer.add(iconEl);
        header.add(iconContainer);

        const name = new Interface('.name');
        name.text('Critical Battery Levels (<20%)');
        name.css({
            fontFamily: 'var(--ui-font-family)', fontSize: '14px', color: '#fff', fontWeight: 'bold'
        });
        header.add(name);

        // Client-side aggregation
        const allSensors = this.sensorManager.getDiscoveredSensors();
        const lowBatterySensors = allSensors.filter(s => {
            const type = this.sensorManager._detectSensorType(s);
            if (type !== 'battery') return false;

            // Check value
            const val = parseFloat(s.state);
            // Include if low (< 20) or if unavailable/NaN (might be dead)
            if (isNaN(val)) return true;
            return val < 20;
        });

        // Sort: Unavailable first, then lowest value
        lowBatterySensors.sort((a, b) => {
            const valA = parseFloat(a.state);
            const valB = parseFloat(b.state);
            if (isNaN(valA) && isNaN(valB)) return 0;
            if (isNaN(valA)) return -1;
            if (isNaN(valB)) return 1;
            return valA - valB;
        });

        if (lowBatterySensors.length === 0) {
            const empty = new Interface('.no-data');
            empty.text('All devices are fully charged.');
            empty.css({ color: 'rgba(255,255,255,0.4)', fontSize: '12px', fontStyle: 'italic' });
            card.add(empty);
        } else {
            lowBatterySensors.forEach(s => {
                const val = parseFloat(s.state);
                const label = s.friendlyName || s.entityId;

                // Color logic
                let color = '#34d399';
                if (val < 20 || isNaN(val)) color = '#f87171';
                else if (val < 50) color = '#fbbf24';

                // Handle unavailable text for Meter
                const displayVal = isNaN(val) ? 0 : val;
                const displayUnit = isNaN(val) ? '(!)' : '%';

                const meter = new Meter({
                    label: label,
                    value: displayVal,
                    unit: displayUnit,
                    min: 0,
                    max: 100,
                    color: color
                });

                // If unavailable, visual hint
                if (isNaN(val)) {
                    meter.valueEl.text('Offline');
                    meter.valueEl.css({ color: '#f87171' });
                }

                card.add(meter);
            });
        }

        this.grid.add(card);
    }

    updateInfoPanel(category) {
        const info = this.getCategoryInfo(category);

        this.infoTitle.text(info.title);
        this.infoDesc.html(info.description); // Use HTML for paragraphs

        this.resourcesList.empty();
        info.resources.forEach(res => {
            const link = new Interface('a.res-link');
            link.text(`${res.title} ↗`);
            link.element.href = res.url;
            link.element.target = '_blank';
            link.css({
                fontFamily: 'var(--ui-font-family)',
                fontSize: '13px',
                color: 'var(--ui-color)',
                textDecoration: 'none',
                opacity: '0.8',
                display: 'block',
                padding: '8px 12px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                transition: 'all 0.2s ease'
            });
            link.element.addEventListener('mouseenter', () => link.css({ opacity: '1', background: 'rgba(255,255,255,0.1)' }));
            link.element.addEventListener('mouseleave', () => link.css({ opacity: '0.8', background: 'rgba(255,255,255,0.05)' }));

            this.resourcesList.add(link);
        });
    }

    getCategoryInfo(category) {
        const data = {
            'overview': {
                title: 'Smart Executive Summary',
                description: 'A prioritized, high-level view of the campus ecosystem. This dashboard uses relevance scoring to intelligently resize and rank widgets, highlighting critical anomalies (e.g., High CO2, Fire Alarms) while shrinking stable metrics.<br><br>The grid adapts in real-time to focus your attention where it matters most.',
                resources: []
            },
            'all': {
                title: 'Global Overview',
                description: 'The Unified Sensor Matrix aggregates data from all 23 active nodes across the campus. This includes environmental sensors (IKEA Vindstyrka, SNZB-02D), occupancy detectors, and specialty equipment like 3D printers in the Makerspace.<br><br>Use the timeline below or filters above to drill down into specific metrics.',
                resources: [
                    { title: 'Campus IoT Documentation', url: '#' },
                    { title: 'Home Assistant Dashboard', url: '#' }
                ]
            },
            'temperature': {
                title: 'Thermal Comfort',
                description: 'Temperature sensors monitor ambient heat levels to ensure occupant comfort and HVAC efficiency. The optimal range for learning environments is typically 20°C - 24°C.<br><br>Alerts are triggered above 28°C or below 18°C.',
                resources: [
                    { title: 'ASHRAE Standard 55', url: 'https://www.ashrae.org/technical-resources/bookstore/standard-55-thermal-environmental-conditions-for-human-occupancy' },
                    { title: 'Thermal Comfort Chart', url: '#' }
                ]
            },
            'co2': {
                title: 'Carbon Dioxide (CO₂)',
                description: 'CO₂ levels are a key indicator of ventilation quality. High levels (>1000 ppm) can lead to drowsiness and reduced cognitive function.<br><br>Normal outdoor air is ~400 ppm. Good indoor air should stay below 800-1000 ppm.',
                resources: [
                    { title: 'ASHRAE 62.1 Standards', url: 'https://www.ashrae.org/technical-resources/standards-and-guidelines' },
                    { title: 'Impact of CO2 on Cognition', url: 'https://ehp.niehs.nih.gov/doi/10.1289/ehp.1510037' }
                ]
            },
            'voc': {
                title: 'Volatile Organic Compounds',
                description: 'VOCs are emitted as gases from certain solids or liquids (cleaners, paints, printers). The VOC Index (0-500) indicates changes in air quality relative to a baseline.<br><br>Lower values indicate cleaner air. Spikes may occur during cleaning or heavy 3D printing usage.',
                resources: [
                    { title: 'EPA: Indoor Air Quality', url: 'https://www.epa.gov/indoor-air-quality-iaq/volatile-organic-compounds-impact-indoor-air-quality' },
                    { title: 'WHO Air Quality Guidelines', url: 'https://www.who.int/news-room/questions-and-answers/item/who-global-air-quality-guidelines' }
                ]
            },
            'pm25': {
                title: 'Particulate Matter 2.5',
                description: 'PM2.5 refers to fine inhalable particles with diameters 2.5 micrometers and smaller. These can penetrate deep into the lungs.<br><br>WHO Guidelines recommend keeping annual averages below 5 µg/m³.',
                resources: [
                    { title: 'WHO Air Quality Guidelines (2021)', url: 'https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health' },
                    { title: 'AirNow: AQI Basics', url: 'https://www.airnow.gov/aqi/aqi-basics/' }
                ]
            },
            'battery': {
                title: 'Device Health',
                description: 'Monitors the battery levels of wireless Zigbee sensors (Sonoff SNZB series). <br><br>Low Battery Limit: 20%. Please schedule maintenance for any red indicators.',
                resources: [
                    { title: 'Zigbee Device Management', url: '#' }
                ]
            },
            'equipment': {
                title: 'Lab Equipment',
                description: 'Real-time status of connected machinery such as the OctoPrint server controlling the 3D printers in the Makerspace.<br><br>Monitors bed temperature, tool temperature, and print job progress.',
                resources: [
                    { title: 'OctoPrint Documentation', url: 'https://docs.octoprint.org/en/master/' }
                ]
            },
            'occupancy': {
                title: 'Space Utilization',
                description: 'Binary presence detection using PIR motion sensors. Used to optimize lighting, HVAC, and cleaning schedules based on actual usage patterns.',
                resources: []
            },
            'humidity': {
                title: 'Relative Humidity',
                description: 'Measures water vapor in the air. Ideal range: 30% - 60%.<br><br>High humidity (>70%) can promote mold growth. Low humidity (<30%) can cause irritation.',
                resources: [
                    { title: 'EPA: Mold Course', url: 'https://www.epa.gov/mold' }
                ]
            },
            'power': {
                title: 'Energy Consumption',
                description: 'Real-time wattage draw from smart plugs and sub-meters. Identifying spectral power signatures helps in predictive maintenance and sustainability auditing.',
                resources: []
            },
            'sun': {
                title: 'Solar Position',
                description: 'Tracks the position of the sun (azimuth/elevation) to automate shading and lighting systems.',
                resources: [{ title: 'Suncalc Utils', url: '#' }]
            },
            'celestial': {
                title: 'Celestial Events',
                description: 'Tracking Sun and Moon cycles to automate circadian lighting and shading systems. Timestamps indicate next occurrence of dawn, dusk, noon, etc.',
                resources: []
            }
        };

        return data[category] || data['all'];
    }
}
