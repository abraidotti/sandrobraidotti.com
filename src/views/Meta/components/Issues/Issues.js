import React from 'react';
import { useRecoilValue } from 'recoil';
import { fetchIssues } from '../selectors';
import { makeStyles } from '@material-ui/core/styles';
import { Card, CardContent, Typography } from '@material-ui/core';

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

const IssueList = () => {
  const classes = useStyles();
  const issues = useRecoilValue(fetchIssues);

  return issues.map(issue => (
    <Typography
      className={classes.title}
      color="textSecondary"
      gutterBottom
      key={`issue-${issue.node.number}`}
    >
      {issue.node.title}
    </Typography>
  ));
};

const Issues = () => {
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography
          component="h5"
          variant="h5"
        >
          Open issues
        </Typography>
        <React.Suspense fallback={<div>Loading...</div>}>
          <IssueList />
        </React.Suspense>
      </CardContent>
    </Card>
  );
};

export default Issues;
