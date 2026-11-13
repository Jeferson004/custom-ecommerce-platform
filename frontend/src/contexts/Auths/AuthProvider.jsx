import { useEffect, useState } from 'react';
import { supabase } from '../../configs/supabase';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const loadProfile = async (currentUser) => {
            if (!currentUser) {
                if (active) {
                    setUser(null);
                    setProfile(null);
                }
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, role')
                .eq('id', currentUser.id)
                .single();

            if (!active) return;

            setUser(currentUser);
            setProfile(error ? null : data);

            if (error) {
                console.error('Profile loading failed:', error);
            }
        };

        const initializeSession = async () => {
            try {
                const {
                    data: { session },
                    error,
                } = await supabase.auth.getSession();

                if (error) throw error;

                await loadProfile(session?.user ?? null);
            } catch (error) {
                console.error('Session initialization failed:', error);

                if (active) {
                    setUser(null);
                    setProfile(null);
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        initializeSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'INITIAL_SESSION') return;

            setTimeout(() => {
                if (active) {
                    loadProfile(session?.user ?? null);
                }
            }, 0);
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        setUser(null);
        setProfile(null);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
