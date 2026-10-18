import {
    findAllCategories,
    findCategoryById,
    createCategory as createCategoryModel,
    updateCategory as updateCategoryModel,
    deleteCategory as deleteCategoryModel,
} from "../models/categoryModel.js";

// GET /api/categories
export const getCategories = async (req, res) => {
    try {
        const categories = await findAllCategories();

        return res.status(200).json(categories);
    } catch (error) {
        console.error("Get categories error:", error);

        return res.status(500).json({
            message: "Failed to retrieve categories.",
        });
    }
};

// GET /api/categories/:id
export const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await findCategoryById(id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found.",
            });
        }

        return res.status(200).json(category);
    } catch (error) {
        console.error("Get category error:", error);

        return res.status(500).json({
            message: "Failed to retrieve category.",
        });
    }
};

// POST /api/categories
export const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({
                message: "Category name is required.",
            });
        }

        const category = await createCategoryModel(
            name.trim(),
            description
        );

        return res.status(201).json(category);
    } catch (error) {
        console.error("Create category error:", error);

        return res.status(500).json({
            message: "Failed to create category.",
        });
    }
};

// PUT /api/categories/:id
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (typeof name !== "string" || name.trim() === "") {
            return res.status(400).json({
                message: "Category name is required.",
            });
        }

        const category = await updateCategoryModel(
            id,
            name.trim(),
            description
        );

        if (!category) {
            return res.status(404).json({
                message: "Category not found.",
            });
        }

        return res.status(200).json(category);
    } catch (error) {
        console.error("Update category error:", error);

        return res.status(500).json({
            message: "Failed to update category.",
        });
    }
};

// DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await deleteCategoryModel(id);

        if (!category) {
            return res.status(404).json({
                message: "Category not found.",
            });
        }

        return res.status(200).json({
            message: "Category deleted successfully.",
        });
    } catch (error) {
        console.error("Delete category error:", error);

        return res.status(500).json({
            message: "Failed to delete category.",
        });
    }
};