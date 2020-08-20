import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@material-ui/core';

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

const listItems = [
  { primary: 'Infrastructure', secondary: 'Terraform / AWS', isDone: true },
  { primary: 'CI/CD', secondary: 'Circle CI', isDone: true },
  { primary: 'Authentication', secondary: 'Auth0', isDone: false },
  { primary: 'View Framework', secondary: 'React', isDone: true },
  { primary: 'Style Library', secondary: 'Material UI', isDone: true },
  {
    primary: 'Testing',
    secondary: 'Jest + React Testing Library',
    isDone: false
  },
  { primary: 'SAST', secondary: '?', isDone: false }
];

const HomeStub = () => {
  const classes = useStyles();

  return (
    <Card className={classes.root}>
      <CardContent>
        <Typography
          component="h2"
          gutterBottom
          variant="h5"
        >
          08/16/2020
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          Hi! I assure you we're open.
        </Typography>
        <Typography
          className={classes.pos}
          color="textSecondary"
        >
          Please stay tuned for updates. I have cool things planned.
        </Typography>
        <Grid
          container
          spacing={2}
        >
          <Grid
            item
            md={6}
            xs={12}
          >
            <Typography
              className={classes.title}
              variant="h6"
            >
              TL;DR:
            </Typography>
            <List
              aria-label="contacts"
              className={classes.root}
            >
              {listItems.map((item, index) => {
                return (
                  <div key={`item-${index}`}>
                    <ListItem>
                      <ListItemText
                        primary={item.primary}
                        secondary={item.secondary}
                      />
                      <ListItemIcon>
                        <div>
                          {item.isDone ? (
                            <Typography
                              className={classes.title}
                              variant="h6"
                            >
                              <span
                                aria-label="check"
                                role="img"
                              >
                                ✔
                              </span>
                            </Typography>
                          ) : (
                            <Typography
                              className={classes.title}
                              variant="h6"
                            >
                              <span
                                aria-label="hourglass"
                                role="img"
                              >
                                ⌛
                              </span>
                            </Typography>
                          )}
                        </div>
                      </ListItemIcon>
                    </ListItem>
                  </div>
                );
              })}
            </List>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default HomeStub;
