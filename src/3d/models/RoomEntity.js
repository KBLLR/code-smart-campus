
export class RoomEntity {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.data = data; // Original data object

        // State
        this.isHovered = false;
        this.isSelected = false;
        this.sensors = [];
    }

    setHovered(value) {
        this.isHovered = value;
    }

    setSelected(value) {
        this.isSelected = value;
    }

    updateSensors(sensors) {
        this.sensors = sensors;
    }
}
