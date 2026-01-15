# Discount Calculation Fix

## Problem

AMOUNT discount was incorrectly treated as **per-unit discount** instead of **line-item total discount**.

### Example of the Bug:
- Quantity: 5 units
- Unit price: ฿300
- Subtotal: ฿1,500
- Discount (AMOUNT): ฿20

**Before (WRONG):**
- Discount applied per unit: ฿300 - ฿20 = ฿280 per unit
- Final subtotal: ฿280 × 5 = ฿1,400
- **Total discount: ฿100** (฿20 × 5 units) ❌

**After (CORRECT):**
- Discount applied to line total: ฿1,500 - ฿20 = ฿1,480
- Final price per unit: ฿1,480 ÷ 5 = ฿296 per unit
- **Total discount: ฿20** (applied once) ✅

## Solution

Updated discount calculation logic in both backend and frontend:

### Discount Types:

1. **NONE**: No discount applied
2. **PERCENT**: Discount percentage applied to subtotal
   - `discountAmount = subtotal × (discountValue / 100)`
   - `finalSubtotal = subtotal - discountAmount`
3. **AMOUNT**: Fixed discount amount applied to line item total (NOT per unit)
   - `discountAmount = discountValue`
   - `finalSubtotal = max(subtotal - discountAmount, 0)`

### Calculation Flow:

```
1. Calculate subtotal before discount:
   subtotal = sellingPricePerUnit × quantitySold

2. Apply discount based on type:
   - PERCENT: discountAmount = subtotal × (discountValue / 100)
   - AMOUNT: discountAmount = discountValue
   
3. Calculate final subtotal:
   finalSubtotal = subtotal - discountAmount
   
4. Calculate final price per unit:
   finalSellingPricePerUnit = finalSubtotal / quantitySold
   
5. Calculate profit:
   lineProfit = (finalSellingPricePerUnit - purchasePricePerUnit) × quantitySold
```

## Changes Made

### Backend: `server/src/services/sales-order.service.ts`

#### 1. Updated `calculateLineItemProfits` Method

**Before:**
```typescript
// WRONG: AMOUNT discount applied per unit
let finalSellingPricePerUnit = item.sellingPricePerUnit;
if (discountType === 'PERCENT') {
  finalSellingPricePerUnit = item.sellingPricePerUnit * (1 - discountValue / 100);
} else if (discountType === 'AMOUNT') {
  finalSellingPricePerUnit = item.sellingPricePerUnit - discountValue; // ❌ Per unit
}
const subtotal = finalSellingPricePerUnit * item.quantitySold;
```

**After:**
```typescript
// CORRECT: AMOUNT discount applied to line total
const subtotalBeforeDiscount = item.sellingPricePerUnit * item.quantitySold;

let finalSubtotal: number;
if (discountType === 'PERCENT') {
  const discountAmount = subtotalBeforeDiscount * (discountValue / 100);
  finalSubtotal = subtotalBeforeDiscount - discountAmount;
} else if (discountType === 'AMOUNT') {
  finalSubtotal = Math.max(subtotalBeforeDiscount - discountValue, 0); // ✅ Line total
}

const finalSellingPricePerUnit = finalSubtotal / item.quantitySold;
```

#### 2. Updated Validation Logic

**Before:**
```typescript
// WRONG: Validates discount against unit price
if (discountType === 'AMOUNT' && discountValue > item.sellingPricePerUnit) {
  throw new Error('Discount amount cannot exceed unit price');
}
```

**After:**
```typescript
// CORRECT: Validates discount against line subtotal
const subtotalBeforeDiscount = item.sellingPricePerUnit * item.quantitySold;
if (discountType === 'AMOUNT' && discountValue > subtotalBeforeDiscount) {
  throw new Error('Discount amount cannot exceed line item subtotal');
}
```

### Frontend: `client/src/pages/SalesOrderCreate.tsx`

#### 1. Updated `calculateFinalPrice` Function

**Before:**
```typescript
// WRONG: AMOUNT discount applied per unit
const calculateFinalPrice = (item: LineItem): number => {
  const sellingPrice = parseFloat(item.sellingPricePerUnit);
  const discountValue = parseFloat(item.discountValue) || 0;
  
  if (item.discountType === 'AMOUNT') {
    return Math.max(0, sellingPrice - discountValue); // ❌ Per unit
  }
  return sellingPrice;
};
```

**After:**
```typescript
// CORRECT: AMOUNT discount applied to line total
const calculateFinalPrice = (item: LineItem): number => {
  const sellingPrice = parseFloat(item.sellingPricePerUnit);
  const quantity = parseInt(item.quantitySold, 10);
  
  const subtotalBeforeDiscount = sellingPrice * quantity;
  const discountValue = parseFloat(item.discountValue) || 0;
  
  let finalSubtotal: number;
  if (item.discountType === 'AMOUNT') {
    finalSubtotal = Math.max(subtotalBeforeDiscount - discountValue, 0); // ✅ Line total
  }
  
  return finalSubtotal / quantity; // Return final price per unit
};
```

#### 2. Updated Validation

**Before:**
```typescript
// WRONG: Validates against unit price
if (discountType === 'AMOUNT' && discountValue > sellingPrice) {
  itemErrors.discountValue = 'ส่วนลดไม่สามารถเกินราคาขาย';
}
```

**After:**
```typescript
// CORRECT: Validates against line subtotal
const subtotal = sellingPrice * quantity;
if (discountType === 'AMOUNT' && discountValue > subtotal) {
  itemErrors.discountValue = 'ส่วนลดไม่สามารถเกินยอดรวมของรายการ';
}
```

#### 3. Updated UI Label

**Before:**
```typescript
<label>
  {item.discountType === 'PERCENT' ? 'ส่วนลด (%)' : 'ส่วนลด (฿)'}
</label>
```

**After:**
```typescript
<label>
  {item.discountType === 'PERCENT' 
    ? 'ส่วนลด (%)' 
    : 'ส่วนลด (฿) - จากยอดรวมรายการ'}
</label>

{/* Added helper text showing subtotal before discount */}
{item.discountType === 'AMOUNT' && (
  <p className="mt-1 text-sm text-gray-600">
    ยอดรวมก่อนลด: {formatCurrency(sellingPrice * quantity)}
  </p>
)}
```

## Testing Examples

### Example 1: PERCENT Discount

**Input:**
- Quantity: 10 units
- Unit price: ฿150
- Discount type: PERCENT
- Discount value: 10%

**Calculation:**
```
Subtotal before discount = 150 × 10 = ฿1,500
Discount amount = 1,500 × (10 / 100) = ฿150
Final subtotal = 1,500 - 150 = ฿1,350
Final price per unit = 1,350 ÷ 10 = ฿135
```

**Expected Result:**
- Final subtotal: ฿1,350
- Final price per unit: ฿135
- Total discount: ฿150

### Example 2: AMOUNT Discount (The Fix)

**Input:**
- Quantity: 5 units
- Unit price: ฿300
- Discount type: AMOUNT
- Discount value: ฿20

**Calculation:**
```
Subtotal before discount = 300 × 5 = ฿1,500
Discount amount = ฿20 (applied once to line total)
Final subtotal = 1,500 - 20 = ฿1,480
Final price per unit = 1,480 ÷ 5 = ฿296
```

**Expected Result:**
- Final subtotal: ฿1,480
- Final price per unit: ฿296
- Total discount: ฿20 ✅

**Before the fix (WRONG):**
- Final subtotal: ฿1,400
- Final price per unit: ฿280
- Total discount: ฿100 ❌

### Example 3: AMOUNT Discount Exceeds Subtotal

**Input:**
- Quantity: 2 units
- Unit price: ฿50
- Discount type: AMOUNT
- Discount value: ฿150

**Calculation:**
```
Subtotal before discount = 50 × 2 = ฿100
Discount amount = ฿150
Final subtotal = max(100 - 150, 0) = ฿0
Final price per unit = 0 ÷ 2 = ฿0
```

**Expected Result:**
- Final subtotal: ฿0
- Final price per unit: ฿0
- Total discount: ฿100 (capped at subtotal)

**Validation:**
- Frontend shows error: "ส่วนลดไม่สามารถเกินยอดรวมของรายการ"
- Backend rejects: "Discount amount cannot exceed line item subtotal"

### Example 4: No Discount

**Input:**
- Quantity: 8 units
- Unit price: ฿200
- Discount type: NONE

**Calculation:**
```
Subtotal = 200 × 8 = ฿1,600
Discount amount = ฿0
Final subtotal = ฿1,600
Final price per unit = ฿200
```

**Expected Result:**
- Final subtotal: ฿1,600
- Final price per unit: ฿200
- Total discount: ฿0

## How to Test

### Step 1: Test PERCENT Discount
1. Create sales order
2. Select batch, quantity: 10, price: ฿150
3. Discount type: PERCENT, value: 10
4. **Verify preview:**
   - ราคาเดิม: ฿150
   - ส่วนลด: 10%
   - ราคาหลังลด: ฿135
   - ยอดรวม: ฿1,350
5. Submit and verify in database

### Step 2: Test AMOUNT Discount (The Fix)
1. Create sales order
2. Select batch, quantity: 5, price: ฿300
3. Discount type: AMOUNT, value: ฿20
4. **Verify preview:**
   - ราคาเดิม: ฿300
   - ส่วนลด: ฿20
   - ราคาหลังลด: ฿296 (not ฿280!)
   - ยอดรวม: ฿1,480 (not ฿1,400!)
5. **Verify helper text:** "ยอดรวมก่อนลด: ฿1,500"
6. Submit and verify in database

### Step 3: Test Validation
1. Create sales order
2. Select batch, quantity: 2, price: ฿50
3. Discount type: AMOUNT, value: ฿150
4. **Verify error:** "ส่วนลดไม่สามารถเกินยอดรวมของรายการ"
5. Cannot submit

### Step 4: Verify Database Values
After creating order with AMOUNT discount:
```sql
SELECT 
  quantitySold,
  sellingPricePerUnit,
  discountType,
  discountValue,
  finalSellingPricePerUnit,
  subtotal,
  lineProfit
FROM SalesOrderLineItem
WHERE id = <line_item_id>;
```

**Expected for qty=5, price=300, discount=20:**
- quantitySold: 5
- sellingPricePerUnit: 300.00
- discountType: AMOUNT
- discountValue: 20.00
- finalSellingPricePerUnit: 296.00 ✅
- subtotal: 1480.00 ✅
- lineProfit: (296 - purchasePrice) × 5

## Success Indicators

✅ AMOUNT discount applied to line total, not per unit
✅ Frontend preview matches backend calculation
✅ UI label clarifies discount is from total: "ส่วนลด (฿) - จากยอดรวมรายการ"
✅ Helper text shows subtotal before discount
✅ Validation checks discount against subtotal, not unit price
✅ Database stores correct finalSellingPricePerUnit and subtotal
✅ Profit calculations are accurate

## Files Modified

1. ✅ `server/src/services/sales-order.service.ts`
   - Updated `calculateLineItemProfits` method
   - Updated `validateLineItems` method
   - Added detailed comments explaining discount logic

2. ✅ `client/src/pages/SalesOrderCreate.tsx`
   - Updated `calculateFinalPrice` function
   - Updated `validateForm` function
   - Updated UI label for AMOUNT discount
   - Added helper text showing subtotal before discount

## Summary

The discount calculation bug has been fixed. AMOUNT discounts are now correctly applied to the line item total (subtotal) rather than per unit. This ensures:

- Consistent behavior between frontend preview and backend calculation
- Accurate profit calculations
- Correct database values for `finalSellingPricePerUnit` and `subtotal`
- Clear UI labels indicating discount is from total amount

Both PERCENT and AMOUNT discounts now work as expected! 🎉
