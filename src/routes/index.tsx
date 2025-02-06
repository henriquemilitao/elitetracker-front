import { createBrowserRouter } from 'react-router-dom';

import { Auth } from '../screens/auth';
import { Focus } from '../screens/focus';
import { Habits } from '../screens/habits';
import { Login } from '../screens/login';
import { PrivateRoute } from './private-route';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PrivateRoute component={<Habits />} />,
  },
  {
    path: '/foco',
    element: <PrivateRoute component={<Focus />} />,
  },
  {
    path: '/entrar',
    element: <Login />,
  },
  {
    path: '/autoricacao',
    element: <Auth />,
  },
]);
