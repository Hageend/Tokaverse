import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../../constants/Colors';
import Ruleta from '../../components/navigation/Ruleta';
import CartaRecompensa from '../../components/navigation/CartaRecompensa';
import RewardCard from '../../components/navigation/CartaRecompensa';
export default function SpinsScreen() {
  const [premio, setPremio] = useState<string | null>(null);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Ruleta TOKA</Text>
      <Text style={styles.subtitle}>Gira la ruleta y obtén premios</Text>

      {/*RUEDA */}
      <Ruleta onResult={setPremio} />

      {/*RECOMPENSA*/}
      {premio && <RewardCard premio={premio} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
