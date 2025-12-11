// src/store/userStore.js
import { create } from "zustand";

export const normalizeRole = (value = "") => {
    const text = value ? value.toString() : "";
    // Keep only lowercase alphanumeric characters so different spellings still match
    return text.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
};

const loadCurrentUser = () => {
    const token = localStorage.getItem("userToken");
    const storedRole = localStorage.getItem("userRole");
    const normalizedRole = normalizeRole(storedRole);
    const displayRole = localStorage.getItem("userRoleRaw") || storedRole || normalizedRole;
    const status = localStorage.getItem("userStatus");
    const infoStatus = localStorage.getItem("infoStatus");
    const username = localStorage.getItem("userName");
    const userId = localStorage.getItem("userId"); // Retrieve user ID
    const email = localStorage.getItem("userEmail");

    return token
        ? {
              username,
              role: normalizedRole,
              normalizedRole,
              displayRole,
              status,
              infoStatus,
              token,
              _id: userId,
              email,
          }
        : null;
};



export const useUserStore = create((set) => ({
    users: [],
    loading: false,
    error: null,
    currentUser: loadCurrentUser(), // Load current user from local storage

    setUsers: (users) => set({ users }),

    fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users`);
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await res.json();
            set({ users: data.data });
        } catch (error) {
            console.error("Failed to fetch users:", error);
            set({ error: "Failed to load users. Please try again later." });
        } finally {
            set({ loading: false });
        }
    },

    // Function to set the current user
    setCurrentUser: (user) => {
        if (user) {
            const normalizedRole = normalizeRole(user.role);
            const displayRole =
                user.role && user.role.toString().trim()
                    ? user.role.toString().trim()
                    : normalizedRole;
            const sanitizedUser = {
                ...user,
                role: normalizedRole,
                normalizedRole,
                displayRole,
            };
            set({ currentUser: sanitizedUser });
        localStorage.setItem("userToken", user.token);
        localStorage.setItem("userRole", normalizedRole);
            localStorage.setItem("userRoleRaw", displayRole);
        localStorage.setItem("userName", user.username);
        localStorage.setItem("userStatus", user.status);
        localStorage.setItem("infoStatus", user.infoStatus);
        localStorage.setItem("userId", user._id); // Store user ID
        if (user.email) {
            localStorage.setItem("userEmail", user.email);
        } else {
            localStorage.removeItem("userEmail");
        }
    } else {
            set({ currentUser: null });
            localStorage.removeItem("userToken");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userRoleRaw");
            localStorage.removeItem("userName");
            localStorage.removeItem("userStatus");
            localStorage.removeItem("infoStatus");
            localStorage.removeItem("userId"); // Remove user ID
        }
    },

    // Function to clear the current user
    clearUser: () => {
        set({ currentUser: null }); // Clear user state
        localStorage.removeItem("userToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userRoleRaw");
        localStorage.removeItem("userName");
        localStorage.removeItem("userStatus");
        localStorage.removeItem("infoStatus");
        localStorage.removeItem("userId"); // Remove user ID
        localStorage.removeItem("userEmail");
    },

    deleteUser: async (uid) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${uid}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!data.success) {
                return { success: false, message: data.message };
            }

            // Optimistically remove the user from the local state
            set((state) => ({
                users: state.users.filter(user => user._id !== uid),
            }));
            return { success: true, message: "User deleted successfully!" };
        } catch (error) {
            console.error("Error deleting user:", error);
            return { success: false, message: "Failed to delete user. Please try again later." };
        }
    },

    updateUser: async (uid, updatedUser) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${uid}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedUser),
            });

            const data = await res.json();
            if (!data.success) return { success: false, message: data.message };

            set((state) => ({
                users: state.users.map((user) => (user._id === uid ? data.data : user)),
            }));
            return { success: true, message: "User updated successfully!" };
        } catch (error) {
            console.error("Error updating user:", error);
            return { success: false, message: "Failed to update user. Please try again later." };
        }
    },

    updateUserInfo: async (updatedInfo) => {
        const uid = updatedInfo._id; // Get user ID from updatedInfo
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/info/${uid}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedInfo),
            });
    
            const data = await res.json();
            if (!data.success) return { success: false, message: data.message };
    
            // Update currentUser in the store
            set((state) => ({
                currentUser: { ...state.currentUser, ...updatedInfo },
                users: state.users.map((user) => (user._id === uid ? data.data : user)),
            }));
            return { success: true, message: "User information updated successfully!" };
        } catch (error) {
            console.error("Error updating user information:", error);
            return { success: false, message: "Failed to update user information. Please try again later." };
        }
    }



}));
