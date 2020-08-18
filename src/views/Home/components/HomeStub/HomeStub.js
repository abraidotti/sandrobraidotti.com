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

const HomeStub = () => {
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography
          className={classes.title}
          color="textSecondary"
          gutterBottom
        >
          Home
        </Typography>
        <Typography
          component="h2"
          variant="h5"
        >
          08/16/2020
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          Hi! Please stay tuned as I make more site updates. I have cool things planned.
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          Authorization (top right) mostly works but doesn't do much at the moment.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default HomeStub;
