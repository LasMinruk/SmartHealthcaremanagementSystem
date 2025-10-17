import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

// Setup test database
beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'test-db'
      }
    });
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}, 30000); // Increase timeout to 30 seconds

// Clean up after each test
afterEach(async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Failed to clean up collections:', error);
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
  }
}, 30000); // Increase timeout to 30 seconds

// Mock console.log to reduce noise in tests
global.console = {
  ...console,
  log: () => {},
  error: () => {},
  warn: () => {},
  info: () => {},
};
