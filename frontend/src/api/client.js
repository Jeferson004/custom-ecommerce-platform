import { supabase } from "../configs/supabase";

const API_URL = import.meta.env.VITE_API_URL;

export const apiRequest = async (path, options = {}) => {
    // Get the current authenticated session.
    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
        throw new Error("Unable to retrieve the current session.");
    }

    const headers = {
        ...options.headers,
    };

    // Set JSON content type when sending a body.
    if (options.body !== undefined && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    // Attach the access token when a user is signed in.
    if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers,
    });

    // Handle responses that contain no JSON body.
    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get("content-type");
    const data = contentType?.includes("application/json")
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        const message =
            typeof data === "object" && data !== null
                ? data.error || data.message
                : data;

        throw new Error(
            message || `Request failed with status ${response.status}`
        );
    }

    return data;
};