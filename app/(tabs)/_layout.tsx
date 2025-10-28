import "react-native-reanimated";

import AppsScreen from "@/app/(tabs)";
import { useColorScheme } from "react-native";

export default function TabLayout() {
    // const screens = [
    //     {
    //         name: "apps-screen",
    //         title: "Skibiops",
    //         icon: "home",
    //         position: "LEFT",
    //         component: <AppsScreen />,
    //         options: {
    //             headerShadowVisible: false,
    //         },
    //     },
    //     {
    //         name: "permission-manager",
    //         title: "Skibiops",
    //         icon: "logo-windows",
    //         position: "RIGHT",
    //         component: <PermissionManager />,
    //     },
    // ];

    // const _renderIcon = (routeName: string, selectedTab: string) => {
    //     let icon = screens.find((e) => e.name === routeName)?.icon;

    //     return <Ionicons name={icon as any} size={25} color={routeName === selectedTab ? "black" : "grey"} />;
    // };

    // const renderTabBar = ({ routeName, selectedTab, navigate }: any) => {
    //     return (
    //         <TouchableOpacity onPress={() => navigate(routeName)} style={styles.tabbarItem}>
    //             {_renderIcon(routeName, selectedTab)}
    //         </TouchableOpacity>
    //     );
    // };

    // return (
    //     <CurvedBottomBarExpo.Navigator
    //         type="UP"
    //         style={styles.bottomBar}
    //         shadowStyle={styles.shawdow}
    //         height={64}
    //         circleWidth={50}
    //         bgColor="white"
    //         initialRouteName={screens[0].name}
    //         borderTopLeftRight
    //         renderCircle={({ selectedTab, navigate }: any) => (
    //             <Animated.View style={styles.btnCircleUp}>
    //                 <TouchableOpacity style={styles.button} onPress={() => {}}>
    //                     <Ionicons name={"planet"} color="white" size={25} />
    //                 </TouchableOpacity>
    //             </Animated.View>
    //         )}
    //         tabBar={renderTabBar}
    //     >
    //         {screens.map((screen, i: number) => {
    //             return (
    //                 <CurvedBottomBarExpo.Screen
    //                     name={screen.name}
    //                     position={screen.position}
    //                     component={() => screen.component}
    //                     options={{
    //                         headerTitle: screen.title,
    //                         headerShown: true,
    //                         ...screen.options,
    //                     }}
    //                 />
    //             );
    //         })}
    //     </CurvedBottomBarExpo.Navigator>
    // );

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

// export const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 20,
//     },
//     shawdow: {
//         shadowColor: "#DDDDDD",
//         shadowOffset: {
//             width: 0,
//             height: 0,
//         },
//         shadowOpacity: 1,
//         shadowRadius: 5,
//     },
//     button: {
//         flex: 1,
//         justifyContent: "center",
//     },
//     bottomBar: {},
//     btnCircleUp: {
//         width: 60,
//         height: 60,
//         borderRadius: 30,
//         alignItems: "center",
//         justifyContent: "center",
//         backgroundColor: "#212121",
//         bottom: 20,
//         shadowColor: "#000",
//         shadowOffset: {
//             width: 0,
//             height: 1,
//         },
//         shadowOpacity: 0.2,
//         shadowRadius: 1.41,
//         elevation: 1,
//     },
//     imgCircle: {
//         width: 30,
//         height: 30,
//         tintColor: "gray",
//     },
//     tabbarItem: {
//         flex: 1,
//         alignItems: "center",
//         justifyContent: "center",
//     },
//     img: {
//         width: 30,
//         height: 30,
//     },
// });
