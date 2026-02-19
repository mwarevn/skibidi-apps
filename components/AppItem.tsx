import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useCallback } from "react";
import { Image, View } from "react-native";
import { Card, Checkbox, Text as PaperText, useTheme } from "react-native-paper";

type Props = {
    item: any;
    setSelectedApps: (apps: any[]) => void;
    selectedApps: any[];
    onLongPress?: (item: any) => void;
};

function AppItemComponent({ item, setSelectedApps, selectedApps, onLongPress }: Props) {
    const scheme = useColorScheme() ?? "light";
    const colors = Colors[scheme];
    const isSelected = selectedApps.some((i: any) => i.packageName === item.packageName);
    const paperTheme = useTheme();

    const handleCheckboxPress = useCallback(() => {
        if (isSelected) {
            setSelectedApps(selectedApps.filter((i: any) => i.packageName !== item.packageName));
        } else {
            setSelectedApps([...selectedApps, item]);
        }
    }, [isSelected, selectedApps, item, setSelectedApps]);

    const handleLongPress = useCallback(() => {
        onLongPress && onLongPress(item);
    }, [onLongPress, item]);

    return (
        <Card
            style={{
                marginHorizontal: 12,
                marginVertical: 2,
                backgroundColor: isSelected ? paperTheme.colors.secondaryContainer : paperTheme.colors.surface,
                borderRadius: 12,
            }}
            onLongPress={handleLongPress}
            mode="elevated"
            elevation={isSelected ? 2 : 0}
        >
            <Card.Content
                style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12 }}
            >
                {item.iconBase64 ? (
                    <Image
                        source={{ uri: `data:image/png;base64,${item.iconBase64}` }}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            marginRight: 12,
                        }}
                        resizeMode="cover"
                    />
                ) : (
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 8,
                            marginRight: 12,
                            backgroundColor: paperTheme.colors.surfaceVariant,
                        }}
                    />
                )}
                <View style={{ flex: 1 }}>
                    <PaperText
                        variant="titleSmall"
                        style={{
                            color: paperTheme.colors.onSurface,
                            fontWeight: "500",
                        }}
                        numberOfLines={1}
                    >
                        {item.appName}
                    </PaperText>
                    <PaperText
                        variant="bodySmall"
                        style={{
                            color: paperTheme.colors.onSurfaceVariant,
                            marginTop: 2,
                        }}
                        numberOfLines={1}
                    >
                        {item.packageName}
                    </PaperText>
                    {!item.enabled && (
                        <PaperText
                            variant="labelSmall"
                            style={{
                                color: paperTheme.colors.error,
                                marginTop: 2,
                            }}
                        >
                            Disabled
                        </PaperText>
                    )}
                </View>
                <Checkbox
                    status={isSelected ? "checked" : "unchecked"}
                    onPress={handleCheckboxPress}
                    color={paperTheme.colors.primary}
                />
            </Card.Content>
        </Card>
    );
}

export default React.memo(AppItemComponent);
