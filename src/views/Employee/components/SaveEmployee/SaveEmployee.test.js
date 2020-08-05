import React from 'react';
import { render } from '@testing-library/react';
import SaveEmployee from './SaveEmployee';

it('render without crashing', () => {
  render(<SaveEmployee />);
});
