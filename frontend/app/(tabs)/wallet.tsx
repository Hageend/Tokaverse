import React from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "../../components/navigation/useStore";

export default function WalletScreen() {
  const router = useRouter();
  const transactions = useStore((s) => s.transactions);
  const balance = useStore((s) => s.balance);

  return (
    <View style={styles.container}>
      {/*  Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Balance disponible</Text>
        <Text style={styles.balanceAmount}>${balance} MXN</Text>
      </View>

      {/* Abrir tienda ejemplo */}
      <Pressable
        style={styles.storeButton}
        onPress={() => router.push("/store")}
      >
        <Text style={styles.buttonText}>Transaccion</Text>
      </Pressable>

      {/* Historial */}
      <Text style={styles.sectionTitle}>Historial</Text>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.transactionCard}>
            <View style={styles.row}>
              <Text style={styles.transactionName}>{item.name}</Text>

              <Text
                style={[
                  styles.transactionAmount,
                  {
                    color: item.amount > 0 ? "#4ADE80" : "#F87171",
                  },
                ]}
              >
                {item.amount > 0 ? "+" : ""}
                {item.amount}
              </Text>
            </View>

            <Text style={styles.transactionStatus}>{item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220", padding: 20 },

  balanceCard: {
    backgroundColor: "#1F2A5A",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
  },

  balanceLabel: { color: "#A0AEC0" },

  balanceAmount: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "bold",
  },

  storeButton: {
    backgroundColor: "#4D61FC",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 10,
  },

  buttonText: { color: "white", fontWeight: "600" },

  sectionTitle: { color: "#A0AEC0", marginBottom: 6 },

  transactionCard: {
    backgroundColor: "#1F2A5A",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  transactionName: { color: "#FFF" },

  transactionAmount: { fontWeight: "bold" },

  transactionStatus: { color: "#A0AEC0", fontSize: 12 },
});