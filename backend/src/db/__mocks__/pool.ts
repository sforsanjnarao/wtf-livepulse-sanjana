// Manual mock for src/db/pool.ts
// Used automatically when jest.mock('../../src/db/pool') is called in tests

const mockPool = {
  query: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
};

export default mockPool;
