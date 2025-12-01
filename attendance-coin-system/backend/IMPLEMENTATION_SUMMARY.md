# Attendance & Coin Credit System - Implementation Summary

## ✅ Completed Features

### 1. Attendance Marking API

#### **POST /api/attendance/mark** (Admin Only)
- Mark or update attendance for a single user
- Supports status: `present`, `absent`, `late`
- Prevents duplicate entries for same user/date
- Updates existing records if already marked

**Request:**
```json
{
  "user_id": 1,
  "date": "2025-12-01",
  "status": "present"
}
```

#### **POST /api/attendance/mark-bulk** (Admin Only)
- Mark attendance for multiple users at once
- Efficient batch processing
- Returns count of marked and updated records

**Request:**
```json
{
  "date": "2025-12-01",
  "attendances": [
    { "user_id": 1, "status": "present" },
    { "user_id": 2, "status": "absent" }
  ]
}
```

---

### 2. Weekly Coin Credit System

#### **POST /api/attendance/weekly-credit** (Admin Only)
Automatically calculates and credits coins based on attendance:

**How it works:**
1. Counts "present" attendance for each student in the week
2. Calculates coins: `attendance_count × coins_per_attendance`
3. Updates wallet balances
4. Records transactions in `coin_transactions`
5. Tracks in `weekly_credits` table (prevents duplicates)

**Request:**
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
    }
  ]
}
```

**Features:**
- ✅ Automatic calculation based on attendance
- ✅ Configurable coins per attendance (default: 10)
- ✅ Prevents duplicate credits for same week
- ✅ Only credits students (role = 'student')
- ✅ Only counts "present" status
- ✅ Complete transaction history
- ✅ Detailed results with user info

---

### 3. Attendance Query APIs

#### **GET /api/attendance/my-records**
Students can view their own attendance history

**Query Parameters:**
- `start_date`, `end_date` - Date range filter
- `limit` - Number of records (default: 30)

#### **GET /api/attendance/my-stats**
Get attendance statistics (present/absent/late counts)

#### **GET /api/attendance/user/:user_id** (Admin Only)
View any user's attendance records

#### **GET /api/attendance/date/:date** (Admin Only)
View all attendance for a specific date

---

### 4. Weekly Credit History APIs

#### **GET /api/attendance/weekly-credits** (Admin Only)
View all weekly credit history

**Query Parameters:**
- `user_id` - Filter by user
- `limit` - Number of records (default: 50)

#### **GET /api/attendance/my-weekly-credits**
Students can view their weekly credit history

---

### 5. Utility Functions

Created `utils/dateUtils.js` with helper functions:

- `getCurrentWeek()` - Get current week dates
- `getPreviousWeek()` - Get previous week dates
- `getWeekForDate(date)` - Get week containing a date
- `formatDate(date)` - Format date as YYYY-MM-DD
- `getToday()` - Get today's date
- `daysBetween(start, end)` - Calculate days between dates
- `isDateInWeek(date, start, end)` - Check if date in week
- `getWeeksInMonth(year, month)` - Get all weeks in month
- `getWeekNumber(date)` - Get ISO week number

---

## Database Tables

### `attendance`
```sql
- id (PK)
- user_id (FK to users)
- date
- status (present/absent/late)
- marked_at
- marked_by (FK to users)
```

### `weekly_credits`
```sql
- id (PK)
- user_id (FK to users)
- week_start_date
- week_end_date
- coins_credited
- attendance_count
- created_at
```

### `coin_transactions`
```sql
- id (PK)
- user_id (FK to users)
- amount
- transaction_type (weekly_credit, etc.)
- description
- balance_after
- created_at
```

---

## System Settings

Configurable via `system_settings` table:

| Setting | Default | Description |
|---------|---------|-------------|
| `coins_per_attendance` | 10 | Coins per attendance day |
| `weekly_credit_day` | Sunday | Day to process credits |

**Update via API:**
```
PUT /api/admin/settings/coins_per_attendance
Body: { "value": "15" }
```

---

## Security & Access Control

### Admin Only Endpoints:
- Mark attendance (single & bulk)
- Process weekly credits
- View all users' attendance
- View weekly credit history
- Manage system settings

### Student Endpoints:
- View own attendance records
- View own statistics
- View own weekly credit history
- View own wallet

### Authentication:
- All endpoints require JWT token
- Token in `Authorization: Bearer <token>` header
- Role-based access control (admin vs student)

---

## Workflow Example

### Complete Weekly Process

**Monday - Friday: Mark Daily Attendance**
```bash
POST /api/attendance/mark
{
  "user_id": 1,
  "date": "2025-12-01",
  "status": "present"
}
```

**Sunday: Process Weekly Credits**
```bash
POST /api/attendance/weekly-credit
{
  "week_start_date": "2025-11-25",
  "week_end_date": "2025-12-01"
}
```

**Result:**
- Student with 5 days present → 50 coins
- Student with 3 days present → 30 coins
- Student with 0 days present → 0 coins

**Students Check Balance:**
```bash
GET /api/wallets/my-wallet
GET /api/attendance/my-weekly-credits
```

---

## Error Prevention

✅ **Duplicate Prevention:**
- Can't credit same week twice
- Attendance can be updated but not duplicated

✅ **Validation:**
- Required fields checked
- Date format validation
- Status value validation

✅ **Transaction Safety:**
- All coin credits recorded
- Balance always tracked
- Audit trail maintained

---

## API Routes Summary

### Attendance Routes (`/api/attendance`)
```
POST   /mark                  - Mark attendance (admin)
POST   /mark-bulk             - Bulk mark (admin)
POST   /weekly-credit         - Process weekly credits (admin)
GET    /my-records            - My attendance
GET    /my-stats              - My statistics
GET    /my-weekly-credits     - My credit history
GET    /user/:user_id         - User attendance (admin)
GET    /date/:date            - Date attendance (admin)
GET    /weekly-credits        - All credits (admin)
DELETE /:id                   - Delete record (admin)
```

---

## Testing the APIs

### 1. Mark Attendance
```bash
curl -X POST http://localhost:3000/api/attendance/mark \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "date": "2025-12-01",
    "status": "present"
  }'
```

### 2. Process Weekly Credits
```bash
curl -X POST http://localhost:3000/api/attendance/weekly-credit \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "week_start_date": "2025-11-25",
    "week_end_date": "2025-12-01"
  }'
```

### 3. View My Credits
```bash
curl http://localhost:3000/api/attendance/my-weekly-credits \
  -H "Authorization: Bearer <student-token>"
```

---

## Next Steps

To use the system:

1. **Initialize Database:**
   - Run migrations.sql to create tables
   - Default admin user will be created

2. **Register Students:**
   - Use `/api/auth/register` to create student accounts

3. **Mark Attendance:**
   - Admin marks daily attendance

4. **Weekly Processing:**
   - Admin runs weekly credit at end of week
   - Students automatically receive coins

5. **Students Use Coins:**
   - Redeem for mess credit
   - Pay for mess meals
   - View transaction history

---

## Documentation Files

- `ATTENDANCE_API.md` - Complete API documentation
- `utils/dateUtils.js` - Date utility functions
- `routes/attendance.js` - Attendance route implementation
- `migrations.sql` - Database schema

---

## Status: ✅ COMPLETE

All attendance marking and weekly coin credit features are fully implemented and ready to use!
