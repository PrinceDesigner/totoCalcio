import React, { useState } from 'react';
import Carousel from 'react-native-reanimated-carousel';
import { View, StyleSheet, Dimensions, Image, Text } from 'react-native';
import Dots from 'react-native-dots-pagination';
import { COLORJS } from '../../theme/themeColor';
import { Button } from 'react-native-paper';
import fontStyle from '../../theme/fontStyle';

const { width, height } = Dimensions.get('window');

const OnboardingCarousel = ({ navigation }) => {
    const [activeSlide, setActiveSlide] = useState(0);

    const slides = [
        { id: '1', image: require('../../assets/onBoarding/1.png') },
        { id: '2', image: require('../../assets/onBoarding/2.png') },
        { id: '3', image: require('../../assets/onBoarding/3.png') },
        { id: '4', image: require('../../assets/onBoarding/4.png') },
        { id: '5', image: require('../../assets/onBoarding/5.png') },
        { id: '6', image: require('../../assets/onBoarding/6.png') },
        { id: '7', image: require('../../assets/onBoarding/7.png') },
        { id: '8', image: require('../../assets/onBoarding/8.png') },
        { id: '9', image: require('../../assets/onBoarding/9.png') },
        { id: '10', image: require('../../assets/onBoarding/10.png') },
        { id: '11', image: require('../../assets/onBoarding/11.png') },
    ];

    const renderItem = ({ item }) => {
        return (
            <View style={styles.slide}>
                <Image source={item.image} style={styles.image} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Carousel
                width={width}
                height={height}
                data={slides}
                scrollAnimationDuration={1000}
                onSnapToItem={(index) => setActiveSlide(index)} // Aggiorna l'indice attivo
                renderItem={({ item }) => renderItem({ item })}
            />

            {/* Indicatore di paginazione */}
            <View style={styles.pagination}>
                <Dots length={slides.length} active={activeSlide} />
                 <Button
                    mode="outlined"
                    onPress={() => navigation.navigate('LoginScreen')}
                    style={styles.joinButton}
                    labelStyle={{
                        color: 'white',
                        ...fontStyle.textBold

                    }}
                >
                    Salta Tutorial
                </Button> 
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORJS.background,
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width, // 90% della larghezza dello schermo
        height: height, // 80% dell'altezza dello schermo
        resizeMode: 'contain', // Mantiene proporzioni senza tagli
    },
    pagination: {
        position: 'absolute',
        bottom: 50, // Posiziona i puntini in basso
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    joinButton: {
        width: '50%',
        height: 49,
        border: '0',
        borderRadius: 24,
        fontSize: 16,
        lineHeight: 21,
        display: 'flex',
        justifyContent: 'center',
        backgroundColor: COLORJS.primary,
    },
});

export default OnboardingCarousel;
