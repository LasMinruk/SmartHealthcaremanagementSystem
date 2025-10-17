# Smart Healthcare Management System - Testing Guide

This guide provides comprehensive information about the testing setup for the appointment management system in the Smart Healthcare Management System.

## Overview

The testing suite covers both backend and frontend components of the appointment management system, providing comprehensive coverage of:

- **Backend**: Models, controllers, routes, and integration tests
- **Frontend**: React components, user interactions, and utility functions
- **End-to-End**: Complete appointment workflows and data consistency

## Quick Start

### Backend Testing
```bash
cd backend
npm install
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

### Frontend Testing
```bash
cd frontend
npm install
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

## Test Structure

```
SmartHealthcaremanagementSystem/
├── backend/
│   ├── tests/
│   │   ├── setup.js                           # Test environment setup
│   │   ├── models/
│   │   │   └── appointmentModel.test.js       # Model tests
│   │   ├── controllers/
│   │   │   └── appointmentController.test.js  # Controller tests
│   │   ├── routes/
│   │   │   └── appointmentRoutes.test.js      # Route tests
│   │   ├── integration/
│   │   │   └── appointmentIntegration.test.js # Integration tests
│   │   └── README.md                          # Backend test documentation
│   ├── jest.config.js                         # Jest configuration
│   └── package.json                           # Test dependencies
└── frontend/
    ├── src/
    │   ├── __tests__/
    │   │   ├── Appointment.test.jsx           # Appointment component tests
    │   │   ├── MyAppointments.test.jsx        # MyAppointments component tests
    │   │   ├── AppointmentUtils.test.js       # Utility function tests
    │   │   └── README.md                      # Frontend test documentation
    │   ├── setupTests.js                      # Test setup
    │   └── __mocks__/
    │       └── fileMock.js                    # File mocking
    ├── jest.config.js                         # Jest configuration
    └── package.json                           # Test dependencies
```

## Test Categories

### 1. Backend Tests

#### Model Tests (`backend/tests/models/appointmentModel.test.js`)
- **Appointment Creation**: Valid appointment creation with proper validation
- **Field Validation**: Required fields, data types, enum values
- **Default Values**: Cancelled, completion, and payment status defaults
- **Database Queries**: Finding appointments by user, doctor, status
- **Updates**: Status changes, payment updates, completion marking
- **Deletion**: Appointment removal and cleanup

#### Controller Tests (`backend/tests/controllers/appointmentController.test.js`)
- **bookAppointment**: Booking logic, government vs private handling, slot management
- **cancelAppointment**: User cancellation, slot freeing, authorization
- **listAppointment**: User appointment retrieval
- **appointmentsDoctor**: Doctor appointment viewing
- **appointmentCancel (Doctor)**: Doctor-initiated cancellations
- **appointmentComplete**: Appointment completion marking
- **appointmentsAdmin**: Admin appointment management

#### Route Tests (`backend/tests/routes/appointmentRoutes.test.js`)
- **Authentication**: Protected route access with valid tokens
- **Authorization**: User-specific operation permissions
- **Request/Response**: HTTP status codes and response formats
- **Error Handling**: Invalid data, missing fields, database errors
- **Integration**: Complete request-response cycles

#### Integration Tests (`backend/tests/integration/appointmentIntegration.test.js`)
- **Complete Lifecycle**: Booking → completion workflow
- **Cancellation Workflow**: Booking → cancellation → slot freeing
- **Government vs Private**: Different doctor types and payment handling
- **Concurrent Booking**: Multiple users booking same slot
- **Availability Management**: Doctor availability changes
- **Data Consistency**: Data integrity across all views
- **Error Recovery**: Partial failure handling

### 2. Frontend Tests

#### Component Tests (`frontend/src/__tests__/Appointment.test.jsx`)
- **Component Rendering**: Doctor info display, slot availability
- **Slot Selection**: Time slot selection, booked slot prevention
- **Appointment Booking**: Booking flow, validation, error handling
- **Authentication**: Unauthenticated user handling
- **Government vs Private**: Different doctor types and fee display
- **Doctor Availability**: Unavailable doctor handling
- **Date Navigation**: Appointment date navigation
- **Error Handling**: Network errors, missing data
- **Accessibility**: ARIA labels, keyboard navigation

#### MyAppointments Tests (`frontend/src/__tests__/MyAppointments.test.jsx`)
- **Component Rendering**: User appointments list display
- **Appointment Status**: Pending, completed, cancelled status display
- **Appointment Cancellation**: Cancellation flow and error handling
- **Payment Handling**: Payment buttons and status display
- **Date/Time Display**: Proper formatting of dates and times
- **Error Handling**: API errors, unauthorized access
- **Data Refresh**: Appointment data refreshing
- **Accessibility**: ARIA labels, keyboard navigation

#### Utility Tests (`frontend/src/__tests__/AppointmentUtils.test.js`)
- **Date Formatting**: Slot date to readable format conversion
- **Time Formatting**: 24-hour to 12-hour format conversion
- **Slot Availability**: Time slot availability checking
- **Payment Status**: Payment status determination
- **Appointment Status**: Appointment status determination
- **Date Validation**: Appointment date and time validation
- **Slot Generation**: Available time slot generation
- **Appointment Filtering**: Status-based appointment filtering

## Key Test Scenarios

### 1. Government Doctor Workflow
```javascript
// Government doctors have zero fees and auto-complete payment
const governmentDoctor = {
  type: 'Government',
  fees: 0,
  available: true
};

// Expected behavior:
// - Amount: 0
// - Payment: 'complete'
// - No payment processing required
```

### 2. Private Doctor Workflow
```javascript
// Private doctors have fees and require payment
const privateDoctor = {
  type: 'Private',
  fees: 500,
  available: true
};

// Expected behavior:
// - Amount: 500
// - Payment: 'pending'
// - Payment processing required
```

### 3. Slot Management
```javascript
// Slot availability checking
const doctorSlots = {
  '15_12_2024': ['10:00', '11:00'],
  '16_12_2024': ['09:00']
};

// Available: 15_12_2024 12:00, 16_12_2024 10:00
// Booked: 15_12_2024 10:00, 15_12_2024 11:00, 16_12_2024 09:00
```

### 4. Authorization Matrix
| User Type | Can Book | Can Cancel Own | Can Cancel Others | Can View All |
|-----------|----------|----------------|-------------------|--------------|
| Patient   | ✅       | ✅             | ❌                | ❌            |
| Doctor    | ❌       | ❌             | ✅ (Own patients) | ❌            |
| Admin     | ❌       | ❌             | ✅ (All)          | ✅            |

## Running Specific Tests

### Backend Tests
```bash
# Model tests only
npm test -- models/appointmentModel.test.js

# Controller tests only
npm test -- controllers/appointmentController.test.js

# Route tests only
npm test -- routes/appointmentRoutes.test.js

# Integration tests only
npm test -- integration/appointmentIntegration.test.js

# Tests matching pattern
npm test -- --testNamePattern="should book appointment"
```

### Frontend Tests
```bash
# Component tests only
npm test -- Appointment.test.jsx

# MyAppointments tests only
npm test -- MyAppointments.test.jsx

# Utility tests only
npm test -- AppointmentUtils.test.js

# Tests matching pattern
npm test -- --testNamePattern="should render appointment"
```

## Test Configuration

### Backend Jest Configuration
```javascript
// backend/jest.config.js
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};
```

### Frontend Jest Configuration
```javascript
// frontend/jest.config.js
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  }
};
```

## Mocking Strategy

### Backend Mocks
- **Email Service**: Prevents actual email sending during tests
- **Console Logging**: Suppresses console output for cleaner tests
- **Database**: Uses MongoDB Memory Server for isolated testing

### Frontend Mocks
- **React Router**: Mocked navigation and routing
- **Axios**: Mocked API calls for predictable responses
- **React Toastify**: Mocked notifications for testing
- **Date/Time**: Mocked system time for consistent testing

## Coverage Goals

### Backend Coverage
- **Models**: 100% coverage of validation and CRUD operations
- **Controllers**: 100% coverage of business logic paths
- **Routes**: 100% coverage of HTTP handling
- **Integration**: Coverage of all major user workflows

### Frontend Coverage
- **Components**: 100% coverage of user interactions and rendering
- **API Integration**: 100% coverage of API calls and error handling
- **Utility Functions**: 100% coverage of helper functions
- **Accessibility**: Coverage of keyboard navigation and ARIA labels

## Best Practices

### Test Writing
1. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
2. **Descriptive Names**: Use clear, descriptive test names that explain the scenario
3. **Single Responsibility**: Each test should verify one specific behavior
4. **Independent Tests**: Tests should not depend on each other
5. **Mock External Dependencies**: Mock API calls, file system, and external services

### Test Organization
1. **Group Related Tests**: Use `describe` blocks to group related tests
2. **Setup and Teardown**: Use `beforeEach` and `afterEach` for consistent test state
3. **Test Data**: Use consistent, realistic test data
4. **Error Scenarios**: Test both success and error cases
5. **Edge Cases**: Test boundary conditions and edge cases

## Troubleshooting

### Common Issues

1. **MongoDB Memory Server**: If tests fail with connection errors, ensure mongodb-memory-server is properly installed
2. **JWT Secret**: Ensure JWT_SECRET environment variable is set or use default test secret
3. **Port Conflicts**: If port conflicts occur, the test setup will automatically handle them
4. **Module Resolution**: Check that all imports are correctly resolved
5. **Mock Setup**: Verify that mocks are properly configured

### Debug Mode
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debug info
npm test -- --testNamePattern="should book appointment successfully"

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd backend && npm install && npm test
      - run: cd frontend && npm install && npm test
```

## Contributing

When adding new appointment features:

1. **Backend**: Add model, controller, route, and integration tests
2. **Frontend**: Add component, interaction, and utility tests
3. **Documentation**: Update this guide with new test scenarios
4. **Coverage**: Ensure new code is covered by tests
5. **Review**: Have tests reviewed along with the feature code

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)

## Support

For questions about the testing setup:
1. Check the test documentation in each test directory
2. Review the test examples and patterns
3. Consult the troubleshooting section
4. Create an issue with specific test failures and error messages
