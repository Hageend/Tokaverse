import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
    premio: string;
}

export default function CartaRecompensa({ premio }: Props) {
    return (
        <View style={styles.card}>
            <View style={styles.iconContainer}>
                <Ionicons name="sparkles" size={28} color="#7DD3FC" />
            </View>
            <Text style={styles.title}>¡FELICIDADES!</Text>
            <Text style={styles.subtitle}>
                Premio: <Text style={styles.highlight}>{premio}</Text>
            </Text>
            <Pressable style={styles.button}>
                <Text style={styles.buttonText}>CANJEAR EN WALLET</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginTop: 30,
        width: "100%",
        maxWidth: 350,
        padding: 20,
        borderRadius: 20,
        backgroundColor: "rgba(30, 41, 59, 0.9)",
        borderWidth: 1,
        borderColor: "rgba(125, 211, 252, 0.3)",
        alignItems: "center",
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(125, 211, 252, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: "800",
        color: "white",
        marginBottom: 6,
    },
    subtitle: {
        color: "#CBD5F5",
        marginBottom: 16,
    },
    highlight: {
        color: "#7DD3FC",
        fontWeight: "700",
    },
    button: {
        width: "100%",
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: "#6366F1",
        alignItems: "center",
    },
    buttonText: {
        color: "white",
        fontWeight: "700",
        letterSpacing: 1,
    },
});