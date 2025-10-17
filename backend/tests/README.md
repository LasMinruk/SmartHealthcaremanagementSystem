# Appointment Management Test Suite

This directory contains comprehensive unit tests for the appointment management system in the Smart Healthcare Management System.

## Test Structure

```
tests/
├── setup.js                           # Test environment setup
├── models/
│   └── appointmentModel.test.js       # Appointment model tests
├── controllers/
│   └── appointmentController.test.js  # Controller function tests
├── routes/
│   └── appointmentRoutes.test.js      # API route tests
├── integration/
│   └── appointmentIntegration.test.js # End-to-end integration tests
└── README.md                          # This file
```

## Test Categories

### 1. Model Tests (`models/appointmentModel.test.js`)
- **Appointment Creation**: Tests for creating valid appointments with proper validation
- **Field Validation**: Tests for required fields, data types, and enum values
- **Default Values**: Tests for default values (cancelled: false, isCompleted: false, payment: 'rejected')
- **Database Queries**: Tests for finding appointments by userId, docId, status
- **Updates**: Tests for updating appointment status, payment, completion
- **Deletion**: Tests for removing appointments

### 2. Controller Tests (`controllers/appointmentController.test.js`)
- **bookAppointment**: Tests for successful booking, government vs private doctor handling, slot availability
- **cancelAppointment**: Tests for user cancellation, slot freeing, authorization
- **listAppointment**: Tests for retrieving user appointments
- **appointmentsDoctor**: Tests for doctor viewing their appointments
- **appointmentCancel (Doctor)**: Tests for doctor-initiated cancellations
- **appointmentComplete**: Tests for marking appointments as completed
- **appointmentsAdmin**: Tests for admin viewing all appointments

### 3. Route Tests (`routes/appointmentRoutes.test.js`)
- **Authentication**: Tests for protected routes requiring valid tokens
- **Authorization**: Tests for user-specific operations
- **Request/Response**: Tests for proper HTTP status codes and response formats
- **Error Handling**: Tests for invalid data, missing fields, database errors
- **Integration**: Tests for complete request-response cycles

### 4. Integration Tests (`integration/appointmentIntegration.test.js`)
- **Complete Lifecycle**: Tests for booking → completion workflow
- **Cancellation Workflow**: Tests for booking → cancellation → slot freeing
- **Government vs Private**: Tests for different doctor types and payment handling
- **Concurrent Booking**: Tests for multiple users booking same slot
- **Availability Management**: Tests for doctor availability changes
- **Data Consistency**: Tests for data integrity across all views
- **Error Recovery**: Tests for handling partial failures

## Test Features

### Database Setup
- Uses MongoDB Memory Server for isolated test database
- Automatic cleanup between tests
- Consistent test data setup

### Mocking
- Email service mocking to prevent actual email sending
- Console logging suppression for cleaner test output
- JWT token generation for authentication testing

### Coverage Areas
- **Models**: Schema validation, CRUD operations, data integrity
- **Controllers**: Business logic, error handling, data transformation
- **Routes**: HTTP handling, authentication, authorization
- **Integration**: End-to-end workflows, data consistency

## Running Tests

### Prerequisites
```bash
cd backend
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test Files
```bash
# Model tests only
npm test -- models/appointmentModel.test.js

# Controller tests only
npm test -- controllers/appointmentController.test.js

# Route tests only
npm test -- routes/appointmentRoutes.test.js

# Integration tests only
npm test -- integration/appointmentIntegration.test.js
```

## Test Data

### Sample Doctor Data
```javascript
{
  name: 'Dr. Test',
  email: 'doctor@test.com',
  speciality: 'Cardiology',
  fees: 500,
  type: 'Private', // or 'Government'
  available: true,
  slots_booked: {}
}
```

### Sample Patient Data
```javascript
{
  name: 'Test Patient',
  email: 'patient@test.com',
  phone: '1234567890'
}
```

### Sample Appointment Data
```javascript
{
  userId: 'patient-id',
  docId: 'doctor-id',
  slotDate: '15_12_2024',
  slotTime: '10:00',
  userData: { name: 'Test Patient' },
  docData: { name: 'Dr. Test' },
  amount: 500,
  date: Date.now(),
  payment: 'pending'
}
```

## Key Test Scenarios

### 1. Government Doctor Booking
- Zero fees for government doctors
- Automatic payment completion
- No payment processing required

### 2. Private Doctor Booking
- Fee-based appointments
- Payment pending status
- Payment processing required

### 3. Slot Management
- Preventing double booking
- Slot availability checking
- Slot freeing on cancellation

### 4. Authorization
- User can only cancel their own appointments
- Doctor can only manage their appointments
- Admin can view all appointments

### 5. Error Handling
- Invalid appointment IDs
- Missing required fields
- Database connection errors
- Network failures

## Best Practices

1. **Isolation**: Each test is independent and doesn't affect others
2. **Cleanup**: Database is cleaned between tests
3. **Mocking**: External services are mocked to prevent side effects
4. **Coverage**: Tests cover happy path, edge cases, and error scenarios
5. **Readability**: Tests are well-documented and easy to understand

## Troubleshooting

### Common Issues

1. **MongoDB Memory Server**: If tests fail with connection errors, ensure mongodb-memory-server is properly installed
2. **JWT Secret**: Ensure JWT_SECRET environment variable is set or use default test secret
3. **Port Conflicts**: If port conflicts occur, the test setup will automatically handle them

### Debug Mode
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debug info
npm test -- --testNamePattern="should book appointment successfully"
```

## Contributing

When adding new appointment features:

1. Add corresponding model tests for new fields/validations
2. Add controller tests for new business logic
3. Add route tests for new endpoints
4. Add integration tests for new workflows
5. Update this README with new test scenarios

## Coverage Goals

- **Models**: 100% coverage of validation and CRUD operations
- **Controllers**: 100% coverage of business logic paths
- **Routes**: 100% coverage of HTTP handling
- **Integration**: Coverage of all major user workflows

Current coverage can be viewed by running:
```bash
npm run test:coverage
```

The coverage report will be generated in the `coverage/` directory.
