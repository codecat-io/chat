import { h, render } from 'preact';
import { Suspense, lazy } from 'preact/compat';
import { Login } from '../components/auth/login';

const Secured = lazy(() => import('./secured'));

export const App = () => (
  <Login>
    <Suspense fallback={<div>loading...</div>}>
      <Secured />
    </Suspense>
  </Login>
)

render(<App />, document.getElementById('root'));
