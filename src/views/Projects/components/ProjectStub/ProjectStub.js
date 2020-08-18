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

const ProjectStub = () => {
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography
          className={classes.title}
          color="textSecondary"
          gutterBottom
        >
          Project Stub
        </Typography>
        <Typography
          component="h2"
          variant="h5"
        >
          Project stub
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          Here's a project
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ProjectStub;
