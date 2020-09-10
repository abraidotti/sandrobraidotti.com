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

const MetaStub = () => {
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography
          className={classes.title}
          color="textSecondary"
          gutterBottom
        >
          Meta
        </Typography>
        <Typography
          component="h2"
          variant="h5"
        >
          Site analytics
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          Powered by Github's GraphQL API and managed with React Recoil.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MetaStub;
