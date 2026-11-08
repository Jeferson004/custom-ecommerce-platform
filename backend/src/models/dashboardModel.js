import pool from "../configs/db.js";

export const getDashboardOverview = async () => {
    const result = await pool.query(`
        SELECT
            (
                SELECT COUNT(*)::INTEGER
                FROM public.products
                WHERE is_active = TRUE
            ) AS total_products,

            (
                SELECT COUNT(*)::INTEGER
                FROM public.orders
            ) AS total_orders,

            (
                SELECT COUNT(*)::INTEGER
                FROM public.profiles
                WHERE role = 'customer'
            ) AS total_customers,

            (
                SELECT COALESCE(SUM(amount), 0)
                FROM public.payments
                WHERE status = 'completed'
            ) AS total_revenue,

            (
                SELECT COUNT(*)::INTEGER
                FROM public.orders
                WHERE status = 'pending'
            ) AS pending_orders,

            (
                SELECT COUNT(*)::INTEGER
                FROM public.inventory i
                JOIN public.products p
                    ON p.id = i.product_id
                WHERE
                    p.is_active = TRUE
                    AND i.quantity <= i.low_stock_threshold
            ) AS low_stock_products
    `);

    return result.rows[0];
};


export const getRecentOrders = async () => {
    const result = await pool.query(`
        SELECT
            o.id AS order_id,
            p.name AS customer_name,
            o.status,
            o.total_amount,
            o.created_at
        FROM public.orders o
        INNER JOIN public.profiles p
            ON p.id = o.profile_id
        ORDER BY o.created_at DESC
        LIMIT 5
    `);

    return result.rows;
};


export const getLowStockProducts = async () => {
    const result = await pool.query(`
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.sku,
            i.quantity,
            i.low_stock_threshold,
            i.updated_at
        FROM public.inventory i
        INNER JOIN public.products p
            ON p.id = i.product_id
        WHERE
            p.is_active = TRUE
            AND i.quantity <= i.low_stock_threshold
        ORDER BY
            i.quantity ASC,
            p.name ASC
    `);

    return result.rows;
};


export const getSalesOverview = async () => {
    const result = await pool.query(`
        WITH date_series AS (
            SELECT generate_series(
                (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE - 6,
                (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Manila')::DATE,
                INTERVAL '1 day'
            )::DATE AS sales_date
        )
        SELECT
            TO_CHAR(ds.sales_date, 'YYYY-MM-DD') AS sales_date,
            COALESCE(SUM(pay.amount), 0) AS revenue
        FROM date_series ds
        LEFT JOIN public.payments pay
            ON pay.status = 'completed'
            AND pay.created_at >= (
                ds.sales_date::TIMESTAMP
                AT TIME ZONE 'Asia/Manila'
            )
            AND pay.created_at < (
                (ds.sales_date + 1)::TIMESTAMP
                AT TIME ZONE 'Asia/Manila'
            )
        GROUP BY ds.sales_date
        ORDER BY ds.sales_date ASC
    `);

    return result.rows;
};

