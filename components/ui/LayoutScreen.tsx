import React from "react";
import { View } from "react-native";

export default function LayoutScreen({ children }: any) {
  return (
    <View
      style={{
        backgroundColor: "#2a2a2aff",
        height: "100%",
      }}
    >
      {children}
    </View>
  );
}
