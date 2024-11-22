import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const ContactPage = () => {
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.headerText}>Contattaci</Text>
        <Text style={styles.contentText}>Per qualsiasi domanda, supporto o problema, puoi contattarci via email:</Text>
        <Text style={styles.emailText}>soccerchallengeprediction@gmail.com</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    padding: 20,
    marginTop: 50,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#49C251',
    marginBottom: 20,
  },
  contentText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 18,
    color: '#f1c40f',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ContactPage;