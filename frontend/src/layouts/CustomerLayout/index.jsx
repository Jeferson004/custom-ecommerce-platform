// import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CustomerHeader from '../../components/Headers/CustomerHeader';
import styles from './customerLayout.module.scss';

function CustomerLayout() {
    return (
        <>
            <CustomerHeader />

            <main className={styles.main}>
                <Outlet />
            </main>
        </>
    );
}

export default CustomerLayout;
