# Attendance & Coin Credit System - API Documentation

## Overview
This document describes the attendance marking and weekly coin credit system APIs.

## Attendance APIs

### 1. Mark Attendance (Admin Only)
**Endpoint:** `POST /api/attendance/mark`

**Description:** Mark or update attendance for a single user on a specific date.

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Request Body:**
```json
{
  "user_id": 1,
  "date": "2025-12-01",
  "status": "present"
}
```

**Status Options:** `present`, `absent`, `late`

**Response:**
```json
{
  "message": "Attendance marked successfully"
}
```

---

### 2. Bulk Mark Attendance (Admin Only)
**Endpoint:** `POST /api/attendance/mark-bulk`

**Description:** Mark attendance for multiple users on the same date.

**Request Body:**
```json
{
  "date": "2025-12-01",
  "attendances": [
    { "user_id": 1, "status": "present" },
    { "user_id": 2, "status": "present" },
    { "user_id": 3, "status": "absent" }
  ]
}
```

**Response:**
```json
{
  "message": "Bulk attendance processed successfully",
  "marked": 2,
  "updated": 1
}
```

---

### 3. Get My Attendance Records
**Endpoint:** `GET /api/attendance/my-records`

**Query Parameters:**
- `start_date` (optional): Filter from this date
- `end_date` (optional): Filter to this date
- `limit` (optional, default: 30): Number of records

**Example:**
```
GET /api/attendance/my-records?start_date=2025-11-01&end_date=2025-11-30&limit=50
```

**Response:**
```json
{
  "records": [
    {
      "id": 1,
      "user_id": 1,
      "date": "2025-12-01",
      "status": "present",
      "marked_at": "2025-12-01T09:00:00.000Z",
      "marked_by": 2
    }
  ]
}
```

---

### 4. Get My Attendance Statistics
**Endpoint:** `GET /api/attendance/my-stats`

**Query Parameters:**
- `start_date` (optional)
- `end_date` (optional)

**Response:**
```json
{
  "stats": {
    "total_days": 20,
    "present_days": 18,
    "absent_days": 1,
    "late_days": 1
  }
}
```

---

## Weekly Coin Credit System

### How It Works

1. **Attendance Tracking:** Students' attendance is marked daily (present/absent/late)
2. **Weekly Calculation:** At the end of each week, coins are calculated based on attendance
3. **Coin Formula:** `Coins = Number of Present Days × Coins Per Attendance`
4. **Default Rate:** 10 coins per attendance (configurable in system settings)
5. **Automatic Credit:** Coins are automatically added to student wallets

---

### 5. Process Weekly Coin Credits (Admin Only)
**Endpoint:** `POST /api/attendance/weekly-credit`

**Description:** Calculate and credit coins to all students based on their attendance for a specific week.

**Request Body:**
```json
{
  "week_start_date": "2025-11-25",
  "week_end_date": "2025-12-01"
}
```

**Response:**
```json
{
  "message": "Weekly coin credits processed successfully",
  "week_start_date": "2025-11-25",
  "week_end_date": "2025-12-01",
  "coins_per_attendance": 10,
  "processed": 45,
  "skipped": 0,
  "results": [
    {
      "user_id": 1,
      "username": "john_doe",
      "full_name": "John Doe",
      "attendance_count": 5,
      "coins_credited": 50,
      "new_balance": 150
    },
    {
      "user_id": 2,
      "username": "jane_smith",
      "full_name": "Jane Smith",
      "attendance_count": 4,
      "coins_credited": 40,
      "new_balance": 120
    }
  ]
}
```

**Features:**
- ✅ Automatically calculates attendance for the week
- ✅ Only counts "present" status
- ✅ Prevents duplicate credits for the same week
- ✅ Updates wallet balances
- ✅ Records transactions in `coin_transactions` table
- ✅ Tracks history in `weekly_credits` table

---

### 6. Get Weekly Credit History (Admin Only)
**Endpoint:** `GET /api/attendance/weekly-credits`

**Query Parameters:**
- `user_id` (optional): Filter by specific user
- `limit` (optional, default: 50)

**Example:**
```
GET /api/attendance/weekly-credits?user_id=1&limit=10
```

**Response:**
```json
{
  "credits": [
    {
      "id": 1,
      "user_id": 1,
      "username": "john_doe",
      "full_name": "John Doe",
      "week_start_date": "2025-11-25",
      "week_end_date": "2025-12-01",
      "coins_credited": 50,
      "attendance_count": 5,
      "created_at": "2025-12-02T00:00:00.000Z"
    }
  ]
}
```

---

### 7. Get My Weekly Credit History
**Endpoint:** `GET /api/attendance/my-weekly-credits`

**Query Parameters:**
- `limit` (optional, default: 10)

**Response:**
```json
{
  "credits": [
    {
      "id": 1,
      "user_id": 1,
      "week_start_date": "2025-11-25",
      "week_end_date": "2025-12-01",
      "coins_credited": 50,
      "attendance_count": 5,
      "created_at": "2025-12-02T00:00:00.000Z"
    }
  ]
}
```

---

## System Settings

The following settings control the coin credit system:

| Setting Key | Default Value | Description |
|------------|---------------|-------------|
| `coins_per_attendance` | 10 | Number of coins credited per attendance |
| `weekly_credit_day` | Sunday | Day of the week when coins are credited |

**Update Settings (Admin Only):**
```
PUT /api/admin/settings/coins_per_attendance
Body: { "value": "15" }
```

---

## Workflow Example

### Weekly Coin Credit Process

1. **Week 1:** Students attend classes (Nov 25 - Dec 1)
   - Mark attendance daily using `/api/attendance/mark`

2. **End of Week:** Admin processes coin credits
   ```bash
   POST /api/attendance/weekly-credit
   {
     "week_start_date": "2025-11-25",
     "week_end_date": "2025-12-01"
   }
   ```

3. **Result:** Each student receives coins based on attendance
   - 5 days present = 50 coins (at 10 coins/day)
   - 3 days present = 30 coins
   - 0 days present = 0 coins

4. **Students can check:**
   - Wallet balance: `GET /api/wallets/my-wallet`
   - Credit history: `GET /api/attendance/my-weekly-credits`

---

## Database Tables Involved

### `attendance`
Stores daily attendance records

### `weekly_credits`
Tracks weekly coin credits (prevents duplicates)

### `coin_transactions`
Records all coin movements (including weekly credits)

### `wallets`
Stores current coin and mess balances

---

## Error Handling

**Common Errors:**

- `400` - Missing required fields
- `401` - Not authenticated
- `403` - Not authorized (admin required)
- `404` - Resource not found
- `409` - Duplicate entry (week already credited)
- `500` - Server error

---

## Notes

- Only users with `role = 'student'` receive weekly coin credits
- Weekly credits can only be processed once per week per user
- Only "present" status counts toward coin credits
- "absent" and "late" statuses do not earn coins
- Admins can view all attendance and credit history
- Students can only view their own records
