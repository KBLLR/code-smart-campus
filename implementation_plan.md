# Implementation Plan: Connecting Real Data Sources

This plan outlines the steps to replace mock data with real-time integrations from Google Calendar, Slack, and Notion for Code University.

## 1. Google Calendar Integration (code.berlin)

**Goal**: Display real-time class schedules and events for each classroom using Code University Google Workspace.

### Architecture
- **Backend**: Create a `CalendarService` in `tier2-orchestrator`.
- **Auth**: Use a Service Account with domain-wide delegation (if possible) or a dedicated user account with read access to room resources.
- **Mapping**: Map Google Calendar Resource IDs (rooms) to our internal `classroom_id`.

### Steps
1.  **Credentials**: Obtain `credentials.json` for a Google Cloud Service Account with Calendar API enabled.
2.  **Configuration**: Create `config/calendar_mapping.json` to map Room Emails -> Classroom IDs.
    ```json
    {
      "lab-a@code.berlin": "lab-a",
      "b-19@code.berlin": "b-19"
    }
    ```
3.  **Implementation**:
    - Install `googleapis` package in `tier2-orchestrator`.
    - Implement `getEvents(classroomId, timeRange)` method.
    - Normalize events to our `ClassroomEvent` schema.
4.  **API**: Update `/api/smartcampus/classrooms/:id/events` endpoint in `server/routes/smartcampus.js`.

## 2. Slack Integration

**Goal**: Display live "chatter" or activity levels from relevant Slack channels (e.g., `#club-chemistry`, `#help-engineering`).

### Architecture
- **Backend**: Create a `SlackService` in `tier2-orchestrator`.
- **Auth**: Use a Slack App with a Bot Token (`xoxb-...`).
- **Scopes**: `channels:history`, `groups:history` (read-only).

### Steps
1.  **Setup**: Create a Slack App in the Code University workspace.
2.  **Configuration**: Map Classroom IDs to Channel IDs.
    ```json
    {
      "lab-a": "C12345678", // #lab-a-discussion
      "cantina": "C87654321" // #random
    }
    ```
3.  **Implementation**:
    - Install `@slack/web-api` in `tier2-orchestrator`.
    - Implement `getRecentMessages(channelId)` and `getActivityLevel(channelId)`.
    - **Privacy**: Do not display raw PII. Analyze sentiment/activity or show anonymized summaries.
4.  **API**: Add `/api/smartcampus/classrooms/:id/activity` endpoint.

## 3. Notion Integration (Learning Platform Replacement)

**Goal**: Show current assignments, materials, or course context from Notion pages used for course management.

### Architecture
- **Backend**: Create `NotionService` in `tier2-orchestrator`.
- **Auth**: Notion Integration Token (`secret_...`).
- **Context**: Map "Courses" or "Rooms" to Notion Database IDs or Page IDs.

### Steps
1.  **Setup**: Create an internal integration in Notion workspace.
2.  **Configuration**: Map Classroom IDs or Course Codes to Notion Database IDs.
    ```json
    {
      "CS101": "database_id_123",
      "lab-a": "page_id_456"
    }
    ```
3.  **Implementation**:
    - Install `@notionhq/client` in `tier2-orchestrator`.
    - Implement `getCourseContext(courseId)` or `getRoomPage(roomId)`.
    - Retrieve "Active Assignments" or "Recent Materials" properties.
4.  **API**: Add `/api/smartcampus/classrooms/:id/context` endpoint.

## 4. Backend Orchestration

We will centralize these integrations in `tier2-orchestrator`.

### New API Endpoints (in `server/routes/smartcampus.js`)
- `GET /api/smartcampus/integrations/calendar/:roomId`
- `GET /api/smartcampus/integrations/slack/:roomId`
- `GET /api/smartcampus/integrations/notion/:roomId`

### Data Flow
1.  Frontend requests `ClassroomPage`.
2.  Frontend calls `fetchEvents`, `fetchActivity`, `fetchContext`.
3.  Backend proxies these calls to respective services, caches results for performance (e.g., 5-minute cache), and returns normalized JSON.

## Next Steps for User
1.  **Credentials Required**:
    *   **Google**: Service Account `credentials.json` (or Client ID/Secret).
    *   **Slack**: Bot User OAuth Token (`xoxb-...`).
    *   **Notion**: Internal Integration Token (`secret_...`).
2.  **Approval**: Approve this plan to begin implementation of the backend services.
