import "react-native-reanimated";

import AppsScreen from "@/app/(tabs)";
import { useColorScheme } from "react-native";

export default function TabLayout() {
    const colorScheme = useColorScheme();

    // return (
    //     <Tabs
    //         screenOptions={{
    //             tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
    //             headerShown: true,
    //             tabBarButton: HapticTab,
    //         }}
    //         initialRouteName="index"
    //     >
    //         <Tabs.Screen
    //             name="index"
    //             options={{
    //                 title: "mwarevn",
    //                 tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
    //             }}
    //         />
    //         <Tabs.Screen
    //             name="widget-list"
    //             options={{
    //                 title: "Widgets App",
    //                 tabBarIcon: ({ color }) => <Camera color={color} size={28} />,
    //             }}
    //         />
    //     </Tabs>
    // );

    return <AppsScreen />;
}
