import fs from 'fs';
import path from 'path';

export function sensorHistoryPlugin() {
    const shouldPersist = false; // Force disabled to prevent report writes during dev

    return {
        name: 'sensor-history-plugin',
        configureServer(server) {
            server.middlewares.use('/api/save-file', async (req, res, next) => {
                if (req.method === 'POST') {
                    if (!shouldPersist) {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ success: false, reason: 'persistence disabled' }));
                        return;
                    }

                    let body = '';
                    req.on('data', chunk => {
                        body += chunk.toString();
                    });

                    req.on('end', () => {
                        try {
                            const { filename, data } = JSON.parse(body);

                            if (!filename || !data) {
                                throw new Error('Missing filename or data');
                            }

                            // Security: Ensure filename doesn't contain directory traversal
                            const safeFilename = path.basename(filename);
                            const filePath = path.resolve(process.cwd(), 'src/data/reports', safeFilename);

                            // Ensure directory exists
                            const dir = path.dirname(filePath);
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir, { recursive: true });
                            }

                            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                            console.log(`[SensorHistoryPlugin] Saved file to ${filePath}`);

                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify({ success: true, filename: safeFilename }));
                        } catch (error) {
                            console.error('[SensorHistoryPlugin] Error saving file:', error);
                            res.statusCode = 500;
                            res.end(JSON.stringify({ success: false, error: error.message }));
                        }
                    });
                } else {
                    next();
                }
            });

            // Endpoint to serve sensor mapping
            server.middlewares.use('/api/sensors/mapping', async (req, res, next) => {
                if (req.method === 'GET') {
                    try {
                        const mappingPath = path.resolve(process.cwd(), 'src/data/sensors/sensors-mapping.json');
                        if (!fs.existsSync(mappingPath)) {
                            res.statusCode = 404;
                            res.end(JSON.stringify({ error: 'Mapping file not found' }));
                            return;
                        }
                        const content = fs.readFileSync(mappingPath, 'utf-8');
                        res.setHeader('Content-Type', 'application/json');
                        res.end(content);
                    } catch (error) {
                        console.error('[SensorHistoryPlugin] Error serving mapping:', error);
                        res.statusCode = 500;
                        res.end(JSON.stringify({ error: error.message }));
                    }
                } else {
                    next();
                }
            });

            // Endpoint to get calendar events from ICS files
            server.middlewares.use('/api/integrations/calendar', async (req, res, next) => {
                if (req.method === 'GET') {
                    try {
                        const calendarDir = path.resolve(process.cwd(), 'src/data/integrations/calendar');
                        if (!fs.existsSync(calendarDir)) {
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify([]));
                            return;
                        }

                        const files = fs.readdirSync(calendarDir).filter(f => f.endsWith('.ics'));
                        const allEvents = [];

                        for (const file of files) {
                            const content = fs.readFileSync(path.join(calendarDir, file), 'utf-8');
                            // Simple parsing logic here since we can't import the frontend ICSParser class easily in Node context
                            // We'll just return raw content or simple parsed structure
                            allEvents.push({ filename: file, content });
                        }

                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(allEvents));
                    } catch (error) {
                        console.error('[SensorHistoryPlugin] Error reading calendars:', error);
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({ error: error.message }));
                    }
                } else {
                    next();
                }
            });
        },
    };
}
