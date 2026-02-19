import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

const PERMISSION_KEY = "selected_permission";

type PermissionType = "shizuku" | "root" | null;

interface PermissionContextType {
    permission: PermissionType;
    setPermission: (perm: PermissionType) => Promise<void>;
    isLoading: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider = ({ children }: { children: ReactNode }) => {
    const [permission, setPermissionState] = useState<PermissionType>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPermission();
    }, []);

    const loadPermission = async () => {
        try {
            const stored = await AsyncStorage.getItem(PERMISSION_KEY);
            setPermissionState(stored as PermissionType);
        } catch (e) {
            console.warn("Error loading permission:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const setPermission = async (perm: PermissionType) => {
        setPermissionState(perm);
        if (perm) {
            await AsyncStorage.setItem(PERMISSION_KEY, perm);
        } else {
            await AsyncStorage.removeItem(PERMISSION_KEY);
        }
    };

    return (
        <PermissionContext.Provider value={{ permission, setPermission, isLoading }}>
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermission = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error("usePermission must be used within PermissionProvider");
    }
    return context;
};
