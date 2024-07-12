// jest.config.js
export default {
  testEnvironment: 'node',
  roots: ['./tests'],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'json', 'jsx', 'node']
};
