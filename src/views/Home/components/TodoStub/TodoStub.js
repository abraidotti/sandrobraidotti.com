import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Card, CardContent, Typography } from '@material-ui/core';

const useStyles = makeStyles({
  root: {
    minWidth: 275
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)'
  },
  pos: {
    marginBottom: 12
  }
});

const TodoStub = () => {
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography
          component="h2"
          gutterBottom
          variant="h5"
        >
          Todos
        </Typography>
        <Typography color="textSecondary">
          <Button
            color="primary"
            disableElevation
            href="/meta"
            variant="contained"
          >
            Check the site meta
          </Button>
        </Typography>
      </CardContent>
    </Card>
  );
};

export default TodoStub;
