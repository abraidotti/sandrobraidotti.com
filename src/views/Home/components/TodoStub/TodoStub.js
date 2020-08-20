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
            href="https://github.com/abraidotti/sandrobraidotti.com/projects/1"
            target="_blank"
            variant="contained"
          >
            Open the kanban board
          </Button>
        </Typography>
      </CardContent>
    </Card>
  );
};

export default TodoStub;
