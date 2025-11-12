# Session: History API 401 Unauthorized Error Investigation

**Date:** 2025-11-12
**Duration:** ~30 minutes
**Models consulted:** Claude Sonnet 4.5
**Session Type:** Debugging & Authentication Investigation
**Related Tasks:** HADS-R10

---

## Objectives

1. Investigate why History API returns 401 Unauthorized
2. Verify token configuration and permissions
3. Determine if token needs regeneration or if proxy configuration is the issue
4. Document findings for professor consultation

---

## Problem Statement

When requesting entity history via the REST API, the application receives a **401 Unauthorized** error:

```
GET /history/period/2025-11-12T09:41:21.768Z?filter_entity_id=sensor.sun_next_dusk&minimal_response=true&no_attributes=true
failed (401): 401: Unauthorized
```

**Observed Behavior:**
- ✅ **WebSocket connection**: Working perfectly (live state updates received)
- ✅ **Entity state queries**: Working
- ❌ **History API queries**: 401 Unauthorized

---

## Technical Details

### Configuration

**Environment Variables** (`.env`):
```env
VITE_HA_URL="/api"
VITE_HA_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiIwMDUxY2E0Yzc0Y2Q0ZDAzOTEyZTk5NzIyYWUxYzZlNSIsImlhdCI6MTc0NDEzMjk2MywiZXhwIjoyMDU5NDkyOTYzfQ.68NLZ-DF5oal5neOyXPKCsL5zCBesaAed-ImFMR-5YA"
```

**Vite Proxy** (`vite.config.js`):
```javascript
proxy: {
  "/api": {
    target: "https://rehvwt2m9uw7pkdyqcuta2lmai6wgzei.ui.nabu.casa",
    changeOrigin: true,
    secure: true,
    rewrite: (path) => path.replace(/^\/api/, "/api"),
  },
}
```

**Token Details** (JWT decoded):
```json
{
  "iss": "00051ca4c74cd4d039122e99722ae1c6e5",
  "iat": 1744132963,
  "exp": 2059492963
}
```
- **Issued:** 2025-02-06
- **Expires:** 2035-02-04 (valid for 10 years)
- **Token Type:** Long-Lived Access Token

### API Call Implementation

**File:** `src/home_assistant/haClient.js`

```javascript
export async function fetchEntityHistory(entityId, { hours = 6 } = {}) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const search = new URLSearchParams({
    filter_entity_id: entityId,
    minimal_response: "true",
    no_attributes: "true",
  });

  const data = await haRequest(`/history/period/${since}?${search.toString()}`);
  // ...
}

async function haRequest(path, { method = "GET", body, headers = {} } = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body,
  });
  // ...
}
```

---

## Possible Root Causes

### 1. **Token Permission Scope** (Most Likely)

Long-Lived Access Tokens in Home Assistant have **granular permissions**. The token might not have `history:read` permissions.

**Evidence:**
- WebSocket works → Token has basic `read` access
- History fails → Token may lack specific history permissions

**Verification Needed:**
- Check token permissions in Home Assistant UI
- Path: **Profile** → **Security** → **Long-Lived Access Tokens**

### 2. **Nabu Casa Proxy Restrictions**

Nabu Casa (cloud proxy) might apply different security policies to REST API endpoints vs WebSocket.

**Evidence:**
- Proxy target: `rehvwt2m9uw7pkdyqcuta2lmai6wgzei.ui.nabu.casa`
- History endpoint might require direct Home Assistant access

**Possible Solutions:**
- Test history API with direct Home Assistant URL (not via Nabu Casa)
- Check if Nabu Casa has specific history endpoint restrictions

### 3. **Authentication Header Handling**

The Vite proxy might be stripping or modifying authentication headers for certain paths.

**Evidence:**
- Proxy rewrite: `path.replace(/^\/api/, "/api")` (identity rewrite)
- `changeOrigin: true` might affect header forwarding

**Verification:**
- Inspect network tab to confirm `Authorization` header is present
- Test direct fetch without Vite proxy

### 4. **CORS Policy Differences**

Different endpoints might have different CORS policies.

**Evidence:**
- WebSocket bypasses CORS (different protocol)
- REST API subject to stricter CORS rules

---

## Diagnostic Tests

### Test 1: Browser Console Direct Fetch

```javascript
// Run in browser console
fetch('/api/history/period/2025-11-12T09:00:00?filter_entity_id=sensor.sun_next_dusk&minimal_response=true', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
  }
})
  .then(r => {
    console.log('Status:', r.status);
    return r.json();
  })
  .then(console.log)
  .catch(console.error);
```

**Expected:**
- Success (200): Token has permissions
- 401: Token lacks history permissions
- 403: Endpoint blocked by proxy/CORS

### Test 2: Check Token Permissions in HA

1. Log into Home Assistant
2. Go to **Profile** → **Security** → **Long-Lived Access Tokens**
3. Find token: `00051ca4c74cd4d039122e99722ae1c6e5`
4. Check permissions:
   - ✅ Required: `history:read` or `read` (global)
   - ❌ If missing: Token needs regeneration

### Test 3: WebSocket History Alternative

Home Assistant supports history queries via WebSocket:

```javascript
{
  "type": "recorder/history_during_period",
  "entity_id": "sensor.sun_next_dusk",
  "start_time": "2025-11-12T09:00:00+00:00",
  "end_time": "2025-11-12T15:00:00+00:00",
  "minimal_response": true
}
```

**Fallback Strategy:**
- If REST history fails, use WebSocket `recorder/history_during_period`
- Requires WebSocket command support in `haClient.js`

---

## Recommendations

### For Professor Consultation

**Question to Ask:**
> "The application's WebSocket connection to Home Assistant works correctly, but the History API endpoint returns 401 Unauthorized. The token appears valid (expires 2035), but might be missing history read permissions. Should I request a new token with explicit history:read scope, or is there a proxy configuration issue?"

**Context to Provide:**
- Token issued: February 2025 (recent)
- WebSocket: ✅ Working
- Live state: ✅ Working
- History API: ❌ 401 Unauthorized
- Access method: Nabu Casa Cloud proxy

**Expected Resolution:**
1. **Professor regenerates token** with full permissions (including history)
2. **OR:** Provides direct Home Assistant URL (bypassing Nabu Casa)
3. **OR:** Enables history access on existing token

### Implementation Options

**Short-term Workaround:**
```javascript
// Disable history chart feature until resolved
export async function fetchEntityHistory(entityId, options) {
  console.warn('[haClient] History API disabled - 401 authentication error');
  return [];
}
```

**Long-term Solution:**
1. Get new token with `history:read` permissions
2. Implement WebSocket-based history queries as fallback
3. Add proper error handling in UI (show "History unavailable" message)

---

## Files Affected

**Authentication:**
- `src/home_assistant/haClient.js` - History API implementation
- `.env` - Token configuration

**UI Components:**
- `src/main.js:1157` - History chart error handling
- Detailed entity modal - Shows "Unable to fetch history from Home Assistant"

---

## Next Steps

1. **Consult professor** about token permissions
2. **Test direct fetch** in browser console (see Test 1 above)
3. **Implement fallback** to hide history chart until resolved
4. **Document outcome** in HADS-R10 task

---

## Related Documentation

- **Home Assistant REST API:** https://developers.home-assistant.io/docs/api/rest/
- **Long-Lived Access Tokens:** https://www.home-assistant.io/docs/authentication/
- **Nabu Casa Cloud:** https://www.nabucasa.com/config/remote/

---

## Appendix: Network Request Details

**Request:**
```http
GET /api/history/period/2025-11-12T09:41:21.768Z?filter_entity_id=sensor.sun_next_dusk&minimal_response=true&no_attributes=true HTTP/1.1
Host: localhost:5175
Authorization: Bearer eyJhbGci...
Content-Type: application/json
```

**Response:**
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "message": "Unauthorized"
}
```

**Expected Response (if working):**
```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  [
    {
      "entity_id": "sensor.sun_next_dusk",
      "state": "2025-11-12T16:04:13+00:00",
      "last_changed": "2025-11-12T09:00:00+00:00"
    }
  ]
]
```
