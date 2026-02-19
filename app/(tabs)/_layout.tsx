import "react-native-reanimated";

import AppsScreen from "@/app/(tabs)";
import { useColorScheme } from "react-native";

export default function TabLayout() {
    const colorScheme = useColorScheme();

    return <AppsScreen />;
}
