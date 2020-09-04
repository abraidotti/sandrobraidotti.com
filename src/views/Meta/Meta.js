import React from 'react';
import { makeStyles } from '@material-ui/styles';
import { Grid } from '@material-ui/core';
import { IssueCounter, IssueList, MetaStub } from './components';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4)
  }
}));

const Meta = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Grid
        container
        spacing={4}
      >
        <Grid
          item
          lg={12}
          md={12}
          xl={12}
          xs={12}
        >
          <MetaStub />
        </Grid>
      </Grid>
      <Grid
        container
        spacing={4}
      >
        <Grid
          item
          lg={4}
          md={4}
          xl={4}
          xs={12}
        >
          <IssueList />
        </Grid>
        <Grid
          item
          lg={4}
          md={4}
          xl={4}
          xs={12}
        >
          <IssueCounter />
        </Grid>
      </Grid>
    </div>
  );
};

export default Meta;
