# Sales Order Creation Debug Guide

## Critical Bug Fixed

### The Problem
The UI showed "ไม่สามารถสร้างคำสั่งขายได้" (Cannot create sales order) but there was no console or network error.

### Root Cause
**Line 283 had a critical typo:**
```typescript
const errorData = { ... }  // Variable named errorData
await apiClient.post('/sales-orders', orderData);  // But code used orderData (doesn't exist!)
```

This caused a JavaScript error that was caught by the try-catch block, showing the generic error message without actually sending the POST request.

### The Fix
1. **Fixed variable name**: Changed `errorData` to `orderData`
2. **Added proper type casting**: Used `Number()` instead of `parseInt/parseFloat` for consistency
3. **Added comprehensive logging**: Every step now logs to console for debugging

## Changes Made

### File: `client/src/pages/SalesOrderCreate.tsx`

#### 1. Fixed handleSubmit Function
**Before:**
```typescript
const errorData = { ... };  // Wrong variable name
await apiClient.post('/sales-orders', orderData);  // orderData doesn't exist!
```

**After:**
```typescript
const orderData = {  // Correct variable name
  customerName: customerName.trim() || undefined,
  lineItems: lineItems.map(item => ({
    batchId: Number(item.batchId),  // Proper type casting
    quantitySold: Number(item.quantitySold),
    sellingPricePerUnit: Number(item.sellingPricePerUnit),
    discountType: item.discountType,
    discountValue: Number(item.discountValue) || 0
  }))
};

await apiClient.post('/sales-orders', orderData);  // Now works!
```

#### 2. Added Comprehensive Logging

**Form Submission:**
```typescript
console.log('[SalesOrder] Form submitted');
console.log('[SalesOrder] Customer name:', customerName);
console.log('[SalesOrder] Line items count:', lineItems.length);
console.log('[SalesOrder] Validation result:', isValid);
console.log('[SalesOrder] Sending order data:', JSON.stringify(orderData, null, 2));
console.log('[SalesOrder] POST /api/sales-orders');
```

**Validation:**
```typescript
console.log('[SalesOrder] Starting form validation');
console.log('[SalesOrder] Validating line item 1:', item);
console.log('[SalesOrder] Line 1: No batch selected');
console.log('[SalesOrder] Line 1: Invalid quantity:', item.quantitySold);
console.log('[SalesOrder] Validation complete. isValid:', isValid);
```

**Error Handling:**
```typescript
console.error('[SalesOrder] Submit failed');
console.error('[SalesOrder] Error response status:', err.response?.status);
console.error('[SalesOrder] Error response data:', err.response?.data);
console.error('[SalesOrder] Final error message:', errorMessage);
```

#### 3. Improved Error Messages
Now shows specific errors for:
- 401: "ต้องการการยืนยันตัวตน กรุณาเข้าสู่ระบบอีกครั้ง"
- 403: "การเข้าถึงถูกปฏิเสธ คุณไม่มีสิทธิ์สร้างใบสั่งขาย"
- Network errors: "ข้อผิดพลาดเครือข่าย กรุณาตรวจสอบการเชื่อมต่อของคุณ"
- Server errors: Shows actual error message from backend

## How to Test

### Step 1: Clear Browser Cache
```javascript
// In console (F12):
localStorage.clear();
location.reload();
```

### Step 2: Login
1. Login as ADMIN or STAFF
2. Navigate to "สร้างใบสั่งขาย" (Create Sales Order)

### Step 3: Fill Form and Submit
1. Select a batch
2. Enter quantity
3. Enter selling price
4. Click "สร้างใบสั่งขาย"

### Step 4: Check Console Logs

**Expected logs on successful submission:**
```
[SalesOrder] Form submitted
[SalesOrder] Customer name: 
[SalesOrder] Line items count: 1
[SalesOrder] Starting form validation
[SalesOrder] Validating line item 1: {batchId: "1", quantitySold: "10", ...}
[SalesOrder] Line 1: Valid
[SalesOrder] Validation complete. isValid: true
[SalesOrder] Total errors: 0
[SalesOrder] Sending order data: {
  "customerName": undefined,
  "lineItems": [
    {
      "batchId": 1,
      "quantitySold": 10,
      "sellingPricePerUnit": 150,
      "discountType": "NONE",
      "discountValue": 0
    }
  ]
}
[SalesOrder] POST /api/sales-orders
[API] Attaching token to request: /sales-orders
[SalesOrder] Response status: 201
[SalesOrder] Response data: {...}
[SalesOrder] Submit complete, isSubmitting: false
```

**Expected logs on validation failure:**
```
[SalesOrder] Form submitted
[SalesOrder] Starting form validation
[SalesOrder] Validating line item 1: {batchId: "", quantitySold: "", ...}
[SalesOrder] Line 1: No batch selected
[SalesOrder] Line 1: No quantity
[SalesOrder] Line 1: No selling price
[SalesOrder] Line 1 has errors: {batchId: "กรุณาเลือกสินค้า", ...}
[SalesOrder] Validation complete. isValid: false
[SalesOrder] Total errors: 1
[SalesOrder] Validation failed, errors: {...}
```

### Step 5: Check Network Tab

**Expected request:**
- URL: `http://localhost:3000/api/sales-orders`
- Method: POST
- Headers: `Authorization: Bearer eyJ...`
- Status: 201 Created
- Request Payload:
```json
{
  "lineItems": [
    {
      "batchId": 1,
      "quantitySold": 10,
      "sellingPricePerUnit": 150,
      "discountType": "NONE",
      "discountValue": 0
    }
  ]
}
```

## Debugging Checklist

### If POST request is NOT sent:

- [ ] Check console for validation errors
- [ ] Look for: `[SalesOrder] Validation failed, errors:`
- [ ] Check which fields are invalid
- [ ] Verify all required fields are filled:
  - Batch selected
  - Quantity > 0
  - Selling price >= 0

### If POST request IS sent but fails:

- [ ] Check console for: `[SalesOrder] Error response status:`
- [ ] Check console for: `[SalesOrder] Error response data:`
- [ ] Verify Authorization header is present (Network tab)
- [ ] Check server logs for backend errors

### If POST succeeds but UI shows error:

- [ ] Check console for: `[SalesOrder] Response status: 201`
- [ ] Check if success message appears
- [ ] Check if form resets
- [ ] Check if batches refresh

## Common Issues

### Issue 1: Validation Fails Silently
**Symptom:** Form doesn't submit, no error shown
**Check:** Console for `[SalesOrder] Validation failed`
**Solution:** Fill all required fields correctly

### Issue 2: Network Error
**Symptom:** "ข้อผิดพลาดเครือข่าย"
**Check:** 
- Server is running: `cd server && npm run dev`
- Network tab shows request
**Solution:** Restart server, check CORS settings

### Issue 3: 401 Unauthorized
**Symptom:** "ต้องการการยืนยันตัวตน"
**Check:** 
- Console for: `[API] No auth token found`
- localStorage has `authToken`
**Solution:** Logout and login again

### Issue 4: 403 Forbidden
**Symptom:** "การเข้าถึงถูกปฏิเสธ"
**Check:** User role (should be ADMIN or STAFF)
**Solution:** This shouldn't happen - both roles can create orders

### Issue 5: Validation Error from Backend
**Symptom:** Specific error message from server
**Check:** Console for: `[SalesOrder] Error response data:`
**Examples:**
- "Insufficient stock" → Reduce quantity
- "Batch not found" → Refresh page, select valid batch
- "Invalid discount" → Check discount value

## Testing Scenarios

### Scenario 1: Basic Order (No Discount)
1. Select batch: "BATCH-001"
2. Quantity: 10
3. Selling price: 150
4. Discount: NONE
5. Submit
6. **Expected:** 201 Created, success message

### Scenario 2: Order with Percent Discount
1. Select batch: "BATCH-001"
2. Quantity: 10
3. Selling price: 150
4. Discount type: PERCENT
5. Discount value: 10
6. Submit
7. **Expected:** 201 Created, final price = 135

### Scenario 3: Order with Amount Discount
1. Select batch: "BATCH-001"
2. Quantity: 10
3. Selling price: 150
4. Discount type: AMOUNT
5. Discount value: 20
6. Submit
7. **Expected:** 201 Created, final price = 130

### Scenario 4: Multiple Line Items
1. Add 2 line items
2. Fill both with valid data
3. Submit
4. **Expected:** 201 Created, both items saved

### Scenario 5: Validation Errors
1. Leave batch empty
2. Submit
3. **Expected:** Validation error, no POST request
4. **Console:** `[SalesOrder] Line 1: No batch selected`

## Success Indicators

After the fix, you should see:

✅ Console logs show form submission
✅ Console logs show validation passing
✅ Console logs show order data being sent
✅ Network tab shows POST request to `/api/sales-orders`
✅ Network tab shows 201 Created response
✅ Success message appears: "สร้างคำสั่งขายสำเร็จ!"
✅ Form resets to empty state
✅ Batches refresh with updated quantities

## Quick Test Commands

### Check if form data is valid
```javascript
// In console after filling form:
console.log('Batch ID:', document.querySelector('select').value);
console.log('Quantity:', document.querySelector('input[type="number"]').value);
```

### Manually trigger validation
```javascript
// This will show validation errors in console
// (Form must be filled first)
```

### Check localStorage
```javascript
console.log('Token:', !!localStorage.getItem('authToken'));
console.log('User:', JSON.parse(localStorage.getItem('user')));
```

## Summary

The critical bug was a simple typo (`errorData` vs `orderData`) that prevented the POST request from being sent. With the fix and comprehensive logging, you can now:

1. **See exactly what's happening** at each step
2. **Identify validation failures** immediately
3. **Debug network issues** with detailed error logs
4. **Verify data is sent correctly** with JSON logging

Both ADMIN and STAFF users should now be able to create sales orders successfully! 🎉
