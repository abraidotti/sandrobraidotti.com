import React from 'react';
import { useRecoilValue } from 'recoil';
import { fetchIssues } from '../selectors';
import { makeStyles } from '@material-ui/core/styles';
import { Card, CardContent, CardHeader, Divider } from '@material-ui/core';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import ScheduleIcon from '@material-ui/icons/Schedule';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

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
  list: {
    overflow: 'auto',
    height: 400
  },
  pos: {
    marginBottom: 12
  }
});

const Issues = () => {
  const classes = useStyles();

  const IssueList = () => {
    const issues = useRecoilValue(fetchIssues);

    return issues.map(issue => (
      <ListItem
        button
        component="a"
        href={issue.node.url}
        key={`issue-${issue.node.number}`}
        target="_blank"
      >
        <ListItemAvatar>
          <Avatar>
            {issue.node.state === 'OPEN' ? (
              <ScheduleIcon />
            ) : (
              <CheckCircleIcon />
            )}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={issue.node.title}
          secondary={new Date(issue.node.updatedAt).toDateString()}
        />
      </ListItem>
    ));
  };

  return (
    <Card className={classes.root}>
      <CardHeader
        subtitle="Last 10"
        title="Github Issues"
      />
      <Divider />
      <CardContent>
        <List className={classes.list}>
          <React.Suspense fallback={<div>Loading...</div>}>
            <IssueList />
          </React.Suspense>
        </List>
      </CardContent>
    </Card>
  );
};

export default Issues;
