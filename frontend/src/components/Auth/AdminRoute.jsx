import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../../configs/supabase';

function AdminRoute() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;

    const checkAccess = async () => {
      try {
        // 1. Verify the authenticated user.
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          if (active) setStatus('unauthenticated');
          return;
        }

        // 2. Retrieve the user's role.
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || !profile) {
          if (active) setStatus('unauthorized');
          return;
        }

        // 3. Allow staff and administrators.
        const allowedRoles = ['staff', 'admin'];

        if (allowedRoles.includes(profile.role)) {
          if (active) setStatus('authorized');
        } else {
          if (active) setStatus('unauthorized');
        }
      } catch {
        if (active) setStatus('unauthorized');
      }
    };

    checkAccess();

    return () => {
      active = false;
    };
  }, []);

  if (status === 'loading') {
    return <p role="status">Checking permissions...</p>;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'unauthorized') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default AdminRoute;
