import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "../../components/navigation/useStore";
import { Image } from "react-native";

export default function StoreScreen() {
    const router = useRouter();
    const addTransaction = useStore((s) => s.addTransaction);
    const spendMoney = useStore((s) => s.spendMoney);

    const [cart, setCart] = useState<any[]>([]);

    const addToCart = (item: any) => setCart((p) => [...p, item]);

    const total = cart.reduce((a, b) => a + b.price, 0);

    const handleBuy = () => {
        if (cart.length === 0) return;

        spendMoney(total);

        addTransaction({
            id: Date.now().toString(),
            name: "Compra tienda",
            amount: -total,
            status: "completed",
        });

        setCart([]);
        router.back();
    };

    const balance = useStore((s) => s.balance);

    if (total > balance) {
        alert("No tienes suficiente saldo");
        return;
    }

    const STORE_ITEMS = [
        {
            id: "1",
            name: "Tarjeta 200$ OXXO",
            price: 200,
            image: require("../../assets/images/oxxo.jpg"),
        },
        {
            id: "2",
            name: "Tarjeta 500$ Amazon",
            price: 500,
            image: require("../../assets/images/amazon.png"),
        },
        {
            id: "3",
            name: "Game Pass 1 año",
            price: 1200,
            image: require("../../assets/images/xbox.png"),
        },
        {
            id: "4",
            name: "App Store 100$",
            price: 100,
            image: require("../../assets/images/aplle.jpeg"),
        },
    ];

    return (
        <View style={styles.container}>

            {/* HEADER DIFERENTE */}
            <View style={styles.header}>
                <Text style={styles.logo}>Amazoner</Text>
                <Pressable onPress={() => router.back()}>
                    <Text style={styles.close}>Cerrar</Text>
                </Pressable>
            </View>

            {/* PRODUCTOS */}
            <FlatList
                data={STORE_ITEMS}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={{ paddingBottom: 120 }}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image
                            source={item.image}
                            style={styles.image}
                            resizeMode="cover"
                        />
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.price}>${item.price}</Text>

                        <Pressable
                            style={styles.addBtn}
                            onPress={() => addToCart(item)}
                        >
                            <Text style={styles.addText}>Añadir</Text>
                        </Pressable>
                    </View>
                )}
            />

            {/* FOOTER FIJO */}
            <View style={styles.footer}>
                <Text style={styles.total}>Total: ${total}</Text>

                <Pressable style={styles.buyBtn} onPress={handleBuy}>
                    <Text style={styles.buyText}>Comprar</Text>
                </Pressable>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },

    header: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#4D61FC",
    },

    logo: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
    },

    close: {
        color: "white",
    },

    card: {
        flex: 1,
        backgroundColor: "white",
        margin: 10,
        borderRadius: 18,
        padding: 12,

        // sombras PRO
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },

        elevation: 5,
    },

    imageMock: {
        height: 80,
        backgroundColor: "#E2E8F0",
        borderRadius: 10,
        marginBottom: 10,
    },

    name: {
        fontSize: 13,
        fontWeight: "600",
    },

    price: {
        color: "#16A34A",
        fontWeight: "bold",
        marginVertical: 5,
    },

    addBtn: {
        backgroundColor: "#4D61FC",
        padding: 8,
        borderRadius: 8,
        alignItems: "center",
    },

    addText: {
        color: "white",
    },

    footer: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        backgroundColor: "white",
        padding: 15,
        borderTopWidth: 1,
        borderColor: "#E5E7EB",
    },

    total: {
        fontSize: 16,
        marginBottom: 10,
    },

    buyBtn: {
        backgroundColor: "#4D61FC",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },

    buyText: {
        color: "white",
        fontWeight: "bold",
    },

    image: {
        width: "100%",
        height: 100,
        borderRadius: 12,
        marginBottom: 10,
    },
});