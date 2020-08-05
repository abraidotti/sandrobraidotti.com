import React from 'react';
import { render } from '@testing-library/react';
import GetEmployee from './GetEmployee';

it('render without crashing', () => {
  render(<GetEmployee />);
});
