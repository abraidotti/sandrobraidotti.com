import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles({
  root: {
    minWidth: 275
  },
  bullet: {
    display: 'inline-block',
    margin: '0 2px',
    transform: 'scale(0.8)'
  },
  title: {
    fontSize: 14
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
          className={classes.title}
          color="textSecondary"
          gutterBottom
        >
          Todos
        </Typography>
        <Typography
          component="h2"
          variant="h5"
        >
          Todos
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          1: Fix up colors, images, and styling
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          2: Fix authentication and private routes
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          3: Start using github issues for todos and delete this thing
        </Typography>
      </CardContent>
    </Card>
  );
};

export default TodoStub;
