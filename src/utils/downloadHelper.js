/**
 * Helper functions to download data as files
 */

/**
 * Download data as JSON file
 */
export function downloadJSON(data, filename = 'data.json') {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download data as YAML file
 * Simple YAML conversion (for basic structures)
 */
export function downloadYAML(data, filename = 'data.yaml') {
  const yamlString = jsonToYAML(data);
  const blob = new Blob([yamlString], { type: 'text/yaml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Simple JSON to YAML converter
 */
function jsonToYAML(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  let yaml = '';

  if (Array.isArray(obj)) {
    obj.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        yaml += `${spaces}-\n${jsonToYAML(item, indent + 1)}`;
      } else {
        yaml += `${spaces}- ${JSON.stringify(item)}\n`;
      }
    });
  } else if (typeof obj === 'object' && obj !== null) {
    Object.entries(obj).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          yaml += `${spaces}${key}:\n`;
          yaml += jsonToYAML(value, indent + 1);
        } else {
          yaml += `${spaces}${key}:\n`;
          yaml += jsonToYAML(value, indent + 1);
        }
      } else {
        yaml += `${spaces}${key}: ${JSON.stringify(value)}\n`;
      }
    });
  }

  return yaml;
}
