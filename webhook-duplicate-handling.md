# Webhook Duplicate Handling Documentation

## Overview
The webhook system has been enhanced to handle duplicate work orders intelligently. Instead of returning errors when receiving duplicate job numbers, the system now updates the existing work order with new information.

## Endpoints

### 1. Create/Update Work Order
- **URL**: `POST /api/webhook/work-orders`
- **Purpose**: Creates new work orders or updates existing ones based on job number
- **Behavior**: 
  - If job number doesn't exist → Creates new work order
  - If job number exists → Updates existing work order with new data

### 2. Update Work Order (Dedicated)
- **URL**: `PUT /api/webhook/work-orders`
- **Purpose**: Updates specific fields of existing work orders
- **Behavior**: 
  - Requires existing job number
  - Only updates provided fields
  - Returns 404 if job number not found

### 3. Add Note to Work Order
- **URL**: `POST /api/webhook/work-orders/notes`
- **Purpose**: Adds notes to existing work orders
- **Behavior**: Requires existing job number

## Authentication
All webhook endpoints require API key authentication:
```
Headers:
X-API-Key: your-webhook-api-key
```

## Request Format

### Work Order Data
```json
{
  "job_no": "WO-2024-001",
  "date": "2024-01-15",
  "supplier_name": "ABC Suppliers",
  "supplier_phone": "555-0123",
  "supplier_email": "contact@abc.com",
  "property_name": "Main Office Building",
  "property_address": "123 Business St, City",
  "property_phone": "555-0456",
  "description": "HVAC maintenance required",
  "po_number": "PO-12345",
  "authorized_by": "John Manager",
  "authorized_contact": "555-0789",
  "authorized_email": "john@company.com",
  "email_subject": "Work Order Request - WO-2024-001",
  "email_sender": "system@company.com",
  "email_received_date": "2024-01-15T10:30:00Z",
  "status": "Pending" // Optional for updates
}
```

## Response Format

### Successful Creation
```json
{
  "success": true,
  "message": "Work order created successfully from email!",
  "action": "created",
  "data": {
    "id": 123,
    "jobNo": "WO-2024-001",
    "status": "Pending"
  }
}
```

### Successful Update
```json
{
  "success": true,
  "message": "Work order updated successfully from email!",
  "action": "updated",
  "data": {
    "id": 123,
    "jobNo": "WO-2024-001",
    "status": "In Progress",
    "updatedFields": ["description", "supplier_phone", "status"]
  }
}
```

## Features

### 1. Duplicate Detection
- Automatically detects duplicate job numbers
- Updates existing records instead of creating duplicates
- Preserves original creation data while updating new fields

### 2. Metadata Tracking
- Tracks email source information (subject, sender, received date)
- Records update method (n8n_webhook, n8n_update_webhook)
- Maintains audit trail of changes

### 3. Automatic Notifications
- Creates system notifications for work order updates
- Notifies relevant users about changes
- Maintains notification history

### 4. Audit Trail
- Automatically creates notes when work orders are updated via webhook
- Records which fields were changed
- Tracks update source and timestamp

## Testing

### Live Server Test
```bash
cd backend
node scripts/test-webhook-duplicates.js
```

### Offline Logic Test
```bash
cd backend
node scripts/test-webhook-duplicates.js --offline
```

## Configuration

### Environment Variables
```bash
WEBHOOK_API_KEY=your-secure-api-key-here
```

### N8N Integration
1. Set webhook URL to: `https://your-domain.com/api/webhook/work-orders`
2. Configure API key in headers: `X-API-Key: your-webhook-api-key`
3. For updates, use PUT method to same endpoint
4. For notes, use: `https://your-domain.com/api/webhook/work-orders/notes`

## Error Handling

### Common Errors
- **400**: Missing required fields (job_no for updates)
- **404**: Work order not found (for dedicated update endpoint)
- **401**: Invalid or missing API key
- **500**: Server error (check logs)

### Logging
All webhook requests are logged with:
- Request data (JSON)
- Processing steps
- Success/failure status
- Error details (if any)

## Best Practices

1. **Always include job_no**: Required for all operations
2. **Use meaningful email subjects**: Helps with tracking and debugging
3. **Include timestamp data**: Helps with audit trails
4. **Handle errors gracefully**: Check response status and messages
5. **Monitor logs**: Review webhook processing logs regularly

## Migration Notes

### Breaking Changes
None - this is a backward-compatible enhancement.

### New Features Added
- Duplicate detection and update logic
- Enhanced metadata tracking
- Automatic notification system
- Dedicated update endpoint
- Comprehensive audit trail

## Support

For issues or questions about webhook functionality:
1. Check server logs for detailed error messages
2. Use the test script to verify functionality
3. Review this documentation for proper request format
4. Contact the development team for assistance
