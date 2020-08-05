import React from 'react';
import { render } from '@testing-library/react';
import UpdateEmployee from './UpdateEmployee';

it('render without crashing', () => {
  render(<UpdateEmployee />);
});
