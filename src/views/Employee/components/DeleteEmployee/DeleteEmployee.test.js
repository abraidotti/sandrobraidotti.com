import React from 'react';
import { render } from '@testing-library/react';
import DeleteEmployee from './DeleteEmployee';

it('render without crashing', () => {
  render(<DeleteEmployee />);
});
