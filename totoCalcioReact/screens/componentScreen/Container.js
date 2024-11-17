import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORJS } from '../../theme/themeColor';

// Definiamo il componente Wrapper
const Wrapper = ({ children, style }) => {
  return <View style={[styles.container, style]}>{children}</View>;
};

// Definiamo gli stili di base
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 10,
    backgroundColor: COLORJS.background
  },
});

export default Wrapper;
