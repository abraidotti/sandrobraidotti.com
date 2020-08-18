import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import {
  AppBar,
  Toolbar,
  Hidden,
  IconButton,
  Typography
} from '@material-ui/core';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import MenuIcon from '@material-ui/icons/Menu';
import PersonIcon from '@material-ui/icons/Person';
import { useAuth0 } from '@auth0/auth0-react';

const useStyles = makeStyles(theme => ({
  root: {
    boxShadow: 'none'
  },
  flexGrow: {
    flexGrow: 1
  },
  authButton: {
    marginLeft: theme.spacing(1)
  },
  logo: {
    width: 150
  }
}));

const Topbar = props => {
  const { className, onSidebarOpen, ...rest } = props;

  const classes = useStyles();

  const { isAuthenticated, loginWithRedirect, logout } = useAuth0();

  return (
    <AppBar
      {...rest}
      className={clsx(classes.root, className)}
    >
      <Toolbar>
        <RouterLink to="/">
          <Typography
            className={classes.flexGrow}
            color="textSecondary"
            variant="h2"
          >
            Sandro Braidotti
          </Typography>
        </RouterLink>
        <div className={classes.flexGrow} />
        <Hidden mdDown>
          {!isAuthenticated && (
            <IconButton
              className={classes.authButton}
              color="inherit"
              onClick={() => loginWithRedirect()}
            >
              <PersonIcon />
            </IconButton>
          )}
          {isAuthenticated && (
            <IconButton
              className={classes.authButton}
              color="inherit"
              onClick={() => logout({ returnTo: window.location.origin })}
            >
              <ExitToAppIcon />
            </IconButton>
          )}
        </Hidden>
        <Hidden lgUp>
          <IconButton
            color="inherit"
            onClick={onSidebarOpen}
          >
            <MenuIcon />
          </IconButton>
        </Hidden>
      </Toolbar>
    </AppBar>
  );
};

Topbar.propTypes = {
  className: PropTypes.string,
  onSidebarOpen: PropTypes.func
};

export default Topbar;
