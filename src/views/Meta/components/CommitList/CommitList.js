import React from 'react';
import { useRecoilValue } from 'recoil';
import { fetchCommitMessages } from '../selectors';
import { makeStyles } from '@material-ui/core/styles';
import { Card, CardContent, CardHeader, Divider } from '@material-ui/core';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

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

const CommitList = () => {
  const classes = useStyles();

  const CommitListItems = () => {
    const commitMessages = useRecoilValue(fetchCommitMessages);

    return commitMessages.map( item => (
      <ListItem
        button
        component="a"
        href={item.node.url}
        key={item.node.abbreviatedOid}
        target="_blank"
      >
        <ListItemText
          primary={item.node.messageHeadline}
          secondary={new Date(item.node.committedDate).toDateString()}
        />
      </ListItem>
    ));
  };

  return (
    <Card className={classes.root}>
      <CardHeader
        subtitle="Last 10"
        title="Latest Commits"
      />
      <Divider />
      <CardContent>
        <List className={classes.list}>
          <React.Suspense fallback={<div>Loading...</div>}>
            <CommitListItems />
          </React.Suspense>
        </List>
      </CardContent>
    </Card>
  );
};

export default CommitList;
