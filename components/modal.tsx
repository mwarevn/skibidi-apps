import React from "react";
import { Modal } from "react-native";

export default function CusModal({
    modalVisible,
    setModalVisible,
    children,
}: {
    modalVisible: boolean;
    setModalVisible: (visible: boolean) => void;
    children: React.ReactNode;
}) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
                setModalVisible(!modalVisible);
            }}
        >
            {children}
        </Modal>
    );
}
