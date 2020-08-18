import uuid from 'uuid/v1';

export default [
  {
    id: uuid(),
    ref: 'TD1',
    item: {
      name: 'fix colors and images'
    },
    createdAt: '2020-08-18',
    status: 'pending'
  },
  {
    id: uuid(),
    ref: 'TD2',
    item: {
      name: 'add dynamic auth buttons to sidebar'
    },
    createdAt: '2020-08-18',
    status: 'listed'
  },
  {
    id: uuid(),
    ref: 'TD3',
    item: {
      name: 'research github api'
    },
    createdAt: '2020-08-18',
    status: 'listed'
  },
  {
    id: uuid(),
    ref: 'TD4',
    item: {
      name: 'clean up default components'
    },
    createdAt: '2020-08-18',
    status: 'pending'
  },
  {
    id: uuid(),
    ref: 'TD5',
    item: {
      name: 'Create working Auth0 projects (dev and prod)'
    },
    createdAt: '2020-08-18',
    status: 'pending'
  },
  {
    id: uuid(),
    ref: 'TD6',
    item: {
      name: 'create CI/CD pipeline'
    },
    createdAt: '2020-08-18',
    status: 'done'
  }
];
