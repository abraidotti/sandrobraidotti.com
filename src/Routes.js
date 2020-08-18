import React from 'react';
import { Switch, Redirect } from 'react-router-dom';

import { RouteWithLayout } from './components';
import { Main as MainLayout, Minimal as MinimalLayout } from './layouts';

import {
  AboutMe as AboutMeView,
  Dashboard as DashboardView,
  UserList as UserListView,
  Typography as TypographyView,
  Icons as IconsView,
  Meta as MetaView,
  News as NewsView,
  Projects as ProjectsView,
  Privacy as PrivacyView,
  Settings as SettingsView,
  SignUp as SignUpView,
  SignIn as SignInView,
  NotFound as NotFoundView
} from './views';

const Routes = () => {
  return (
    <Switch>
      {/* <Redirect
        exact
        from="/"
        to="/dashboard"
      /> */}
      <RouteWithLayout
        component={DashboardView}
        exact
        layout={MainLayout}
        path="/"
      />
      <RouteWithLayout
        component={AboutMeView}
        exact
        layout={MainLayout}
        path="/aboutme"
      />
      <RouteWithLayout
        component={UserListView}
        exact
        layout={MainLayout}
        path="/users"
      />
      <RouteWithLayout
        component={TypographyView}
        exact
        layout={MainLayout}
        path="/typography"
      />
      <RouteWithLayout
        component={IconsView}
        exact
        layout={MainLayout}
        path="/icons"
      />
      <RouteWithLayout
        component={MetaView}
        exact
        layout={MainLayout}
        path="/meta"
      />
      <RouteWithLayout
        component={NewsView}
        exact
        layout={MainLayout}
        path="/news"
      />
      <RouteWithLayout
        component={ProjectsView}
        exact
        layout={MainLayout}
        path="/projects"
      />
      <RouteWithLayout
        component={PrivacyView}
        exact
        layout={MainLayout}
        path="/privacy"
      />
      <RouteWithLayout
        component={SettingsView}
        exact
        layout={MainLayout}
        path="/settings"
      />
      <RouteWithLayout
        component={SignUpView}
        exact
        layout={MinimalLayout}
        path="/sign-up"
      />
      <RouteWithLayout
        component={SignInView}
        exact
        layout={MainLayout}
        path="/sign-in"
      />
      <RouteWithLayout
        component={NotFoundView}
        exact
        layout={MinimalLayout}
        path="/not-found"
      />
      <Redirect to="/not-found" />
    </Switch>
  );
};

export default Routes;
