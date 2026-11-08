import {
    getDashboardOverview,
    getRecentOrders
} from "../models/dashboardModel.js";

export const getDashboardOverviewController = async (req, res) => {
    try {
        const overview = await getDashboardOverview();

        return res.status(200).json({
            success: true,
            data: overview,
        });
    } catch (error) {
        console.error("Dashboard overview error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve dashboard overview.",
        });
    }
};


export const getRecentOrdersController = async (req, res) => {
    try {
        const orders = await getRecentOrders();

        return res.status(200).json({
            success: true,
            data: orders,
        });
    } catch (error) {
        console.error("Recent orders error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve recent orders.",
        });
    }
};
