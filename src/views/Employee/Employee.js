import React from 'react';
import { makeStyles } from '@material-ui/styles';
import { Grid } from '@material-ui/core';

import { SaveEmployee, GetEmployee, UpdateEmployee, DeleteEmployee } from './components';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4)
  }
}));

const Employee = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Grid
        container
        spacing={10}
      >
        <Grid
          item
          lg={6}
          md={4}
          xs={12}
        >
          <SaveEmployee />
        </Grid>
        <Grid
          item
          lg={6}
          md={4}
          xs={12}
        >
          <GetEmployee />
        </Grid>
        <Grid
          item
          lg={6}
          md={4}
          xs={12}
        >
          <UpdateEmployee />
        </Grid>
        <Grid
          item
          lg={6}
          md={4}
          xs={12}
        >
          <DeleteEmployee />
        </Grid>
      </Grid>
    </div>
  );
};

export default Employee;
