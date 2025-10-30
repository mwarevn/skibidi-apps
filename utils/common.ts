import { useCallback } from "react";

const openPlayStore = useCallback((pkg = "moe.shizuku.privileged.api") => {
    try {
        const { Linking } = require("react-native");
        const playUrl = `market://details?id=${pkg}`;
        const webUrl = `https://play.google.com/store/apps/details?id=${pkg}`;
        Linking.openURL(playUrl).catch(() => Linking.openURL(webUrl));
    } catch (err) {
        console.warn("Failed to open Play Store", err);
    }
}, []);

export { openPlayStore };
