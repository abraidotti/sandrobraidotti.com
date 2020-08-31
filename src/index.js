import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react';
import * as serviceWorker from './serviceWorker';
import history from './utils/history';
import { RecoilRoot } from 'recoil';

const onRedirectCallback = appState => {
  history.push(
    appState && appState.returnTo ? appState.returnTo : window.location.pathname
  );
};

ReactDOM.render(
  <Auth0Provider
    clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
    domain={process.env.REACT_APP_AUTH0_DOMAIN}
    onRedirectCallback={onRedirectCallback}
    redirectUri={window.location.origin}
  >
    <RecoilRoot>
      <App />
    </RecoilRoot>
  </Auth0Provider>,
  document.getElementById('root')
);

serviceWorker.unregister();
