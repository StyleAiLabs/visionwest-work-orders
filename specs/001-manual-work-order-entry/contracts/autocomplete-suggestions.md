# API Contract: Autocomplete Suggestions

**Endpoint**: `GET /api/work-orders/suggestions`
**Feature**: Manual Work Order Entry (P3 - Enhancement)
**User Story**: P3 - Attach Property and Supplier Details
**Authentication**: Required (JWT)
**Authorization**: Any authenticated user

## Purpose

Provides autocomplete suggestions for property names and supplier names based on existing work order data. This helps tenancy managers maintain data consistency and reduces typing errors when creating manual work orders.

## Request

### Headers

```
Authorization: Bearer <JWT_TOKEN>
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Type of suggestion: `property` or `supplier` |
| `q` | string | Yes | Search query (minimum 2 characters) |
| `limit` | integer | No | Maximum number of suggestions to return (default: 10, max: 50) |

### Valid Type Values

- `property` - Returns property name suggestions with associated address and phone
- `supplier` - Returns supplier name suggestions with associated contact details

## Response

### Success Response (200 OK) - Property Suggestions

**Request**: `GET /api/work-orders/suggestions?type=property&q=sunset`

```json
{
  "success": true,
  "type": "property",
  "query": "sunset",
  "suggestions": [
    {
      "property_name": "Sunset Apartments - Unit 4B",
      "property_address": "123 Main Street, Auckland 1010",
      "property_phone": "555-0456",
      "match_count": 15
    },
    {
      "property_name": "Sunset Villa Complex",
      "property_address": "456 Beach Road, Wellington",
      "property_phone": "555-0789",
      "match_count": 8
    },
    {
      "property_name": "Sunset Gardens Retirement Home",
      "property_address": "789 Park Avenue, Christchurch",
      "property_phone": null,
      "match_count": 3
    }
  ]
}
```

### Success Response (200 OK) - Supplier Suggestions

**Request**: `GET /api/work-orders/suggestions?type=supplier&q=abc`

```json
{
  "success": true,
  "type": "supplier",
  "query": "abc",
  "suggestions": [
    {
      "supplier_name": "ABC Plumbing Services",
      "supplier_phone": "555-0123",
      "supplier_email": "contact@abcplumbing.com",
      "match_count": 42
    },
    {
      "supplier_name": "ABC Electrical Ltd",
      "supplier_phone": "555-0234",
      "supplier_email": "info@abcelectrical.co.nz",
      "match_count": 18
    },
    {
      "supplier_name": "ABC Building Maintenance",
      "supplier_phone": "555-0345",
      "supplier_email": null,
      "match_count": 7
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `true` for successful requests |
| `type` | string | Echo of the `type` query parameter |
| `query` | string | Echo of the `q` query parameter |
| `suggestions` | array | List of matching suggestions (ordered by match_count DESC) |
| `suggestions[].property_name` | string | Property name (only for `type=property`) |
| `suggestions[].property_address` | string\|null | Property address if available |
| `suggestions[].property_phone` | string\|null | Property phone if available |
| `suggestions[].supplier_name` | string | Supplier name (only for `type=supplier`) |
| `suggestions[].supplier_phone` | string\|null | Supplier phone if available |
| `suggestions[].supplier_email` | string\|null | Supplier email if available |
| `suggestions[].match_count` | integer | Number of work orders using this property/supplier |

## Error Responses

### 400 Bad Request - Missing Parameters

```json
{
  "success": false,
  "message": "Missing required parameter: type. Must be 'property' or 'supplier'."
}
```

**Trigger**: `type` query parameter is missing.

```json
{
  "success": false,
  "message": "Missing required parameter: q. Search query must be at least 2 characters."
}
```

**Trigger**: `q` query parameter is missing or less than 2 characters.

### 400 Bad Request - Invalid Type

```json
{
  "success": false,
  "message": "Invalid type parameter. Must be 'property' or 'supplier'."
}
```

**Trigger**: `type` parameter is not `property` or `supplier`.

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized: Invalid or missing authentication token"
}
```

**Trigger**: JWT token is missing, expired, or invalid.

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "An error occurred while fetching suggestions.",
  "error": "Database query failed"
}
```

**Trigger**: Unexpected server error (database failure, etc.).

## Behavior Notes

1. **Case-Insensitive Search**:
   - Search query is case-insensitive
   - `"sunset"`, `"Sunset"`, and `"SUNSET"` all return the same results

2. **Partial Matching**:
   - Matches anywhere in the property/supplier name
   - `"sun"` matches `"Sunset Apartments"` and `"Sunshine Plaza"`
   - Uses SQL `ILIKE` or `LIKE` with `%query%` pattern

3. **Deduplication**:
   - Results are grouped by property_name or supplier_name
   - Each unique property/supplier appears only once
   - `match_count` indicates how many work orders reference it

4. **Ordering**:
   - Results ordered by `match_count` DESC (most frequently used first)
   - This prioritizes commonly used properties/suppliers

5. **Data Source**:
   - Suggestions pulled from `work_orders` table only
   - Does not include properties/suppliers without work orders
   - Historical data from both manual and email work orders

6. **Performance**:
   - Query debounced on frontend (300ms delay recommended)
   - Database should have indexes on `property_name` and `supplier_name`
   - Default limit of 10 suggestions keeps payload small

## Example Usage

### curl Example

```bash
# Get property suggestions
curl -X GET "https://api.visionwest.com/api/work-orders/suggestions?type=property&q=sunset&limit=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..."

# Get supplier suggestions
curl -X GET "https://api.visionwest.com/api/work-orders/suggestions?type=supplier&q=abc" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5..."
```

### JavaScript (Frontend) Example

```javascript
// Debounced autocomplete function
import { debounce } from 'lodash'; // or custom debounce

const fetchSuggestions = async (type, query) => {
  if (query.length < 2) return [];

  const response = await fetch(
    `/api/work-orders/suggestions?type=${type}&q=${encodeURIComponent(query)}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch suggestions');
  }

  const data = await response.json();
  return data.suggestions;
};

// Debounce to reduce API calls while typing
const debouncedFetchSuggestions = debounce(fetchSuggestions, 300);

// Usage in React component
const [suggestions, setSuggestions] = useState([]);

const handlePropertyInputChange = async (e) => {
  const query = e.target.value;
  if (query.length >= 2) {
    const results = await debouncedFetchSuggestions('property', query);
    setSuggestions(results);
  } else {
    setSuggestions([]);
  }
};
```

## Frontend Integration Example

When a user selects a suggestion, auto-fill related fields:

```javascript
const handleSuggestionSelect = (suggestion, type) => {
  if (type === 'property') {
    setFormData({
      ...formData,
      property_name: suggestion.property_name,
      property_address: suggestion.property_address || '',
      property_phone: suggestion.property_phone || ''
    });
  } else if (type === 'supplier') {
    setFormData({
      ...formData,
      supplier_name: suggestion.supplier_name,
      supplier_phone: suggestion.supplier_phone || '',
      supplier_email: suggestion.supplier_email || ''
    });
  }
  setSuggestions([]);
};
```

## Database Query Example

Backend implementation would use a query similar to:

```sql
-- Property suggestions
SELECT
  property_name,
  property_address,
  property_phone,
  COUNT(*) as match_count
FROM work_orders
WHERE property_name ILIKE '%sunset%'
GROUP BY property_name, property_address, property_phone
ORDER BY match_count DESC
LIMIT 10;

-- Supplier suggestions
SELECT
  supplier_name,
  supplier_phone,
  supplier_email,
  COUNT(*) as match_count
FROM work_orders
WHERE supplier_name ILIKE '%abc%'
GROUP BY supplier_name, supplier_phone, supplier_email
ORDER BY match_count DESC
LIMIT 10;
```

## Related Endpoints

- **POST `/api/work-orders`** - Create manual work order (P1 - uses these suggestions)
- **PUT `/api/work-orders/:id`** - Edit work order (P2 - can also use suggestions)

## Implementation Reference

**Backend File**: `backend/controllers/workOrder.controller.js`
**Route**: `backend/routes/workOrder.routes.js`
**Middleware**: `backend/middleware/auth.middleware.js` (authentication only, no role restriction)

## Performance Considerations

1. **Database Indexes**: Add indexes on `property_name` and `supplier_name` for fast search
2. **Caching**: Consider caching frequently requested suggestions (e.g., Redis)
3. **Rate Limiting**: Consider rate limiting to prevent abuse (e.g., max 100 requests/minute per user)
4. **Frontend Debouncing**: Implement 300ms debounce to reduce API calls while typing
