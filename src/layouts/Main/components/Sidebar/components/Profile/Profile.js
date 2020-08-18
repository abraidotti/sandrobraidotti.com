import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import { Avatar, Typography } from '@material-ui/core';
import { useAuth0 } from '@auth0/auth0-react';


const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: 'fit-content'
  },
  avatar: {
    width: 60,
    height: 60
  },
  name: {
    marginTop: theme.spacing(1)
  }
}));

const Profile = props => {
  const { className, ...rest } = props;

  const classes = useStyles();

  const { user, isAuthenticated } = useAuth0();

  let userInfo;

  if (isAuthenticated) {
    userInfo = {
      name: user.nickname,
      avatar: user.picture,
      bio: user.email
    };
  } else {
    userInfo = {
      name: 'Sandro Braidotti',
      avatar: '/images/sandro-square.jpg',
      bio: 'Keyboard Masher'
    };
    
  }

  return (
    <div
      {...rest}
      className={clsx(classes.root, className)}
    >
      <Avatar
        alt="Person"
        className={classes.avatar}
        component={RouterLink}
        src={userInfo.avatar}
        to="/aboutme"
      />
      <Typography
        className={classes.name}
        variant="h4"
      >
        {userInfo.name}
      </Typography>
      <Typography variant="body2">{userInfo.bio}</Typography>
    </div>
  );
};

Profile.propTypes = {
  className: PropTypes.string
};

export default Profile;
