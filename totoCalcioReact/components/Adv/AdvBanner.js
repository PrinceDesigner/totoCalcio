import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export const BannerAdComponent = () => {
    const bannerRef = useRef(null);

    return (
        <View>
            <BannerAd
                ref={bannerRef}
                unitId={TestIds.ADAPTIVE_BANNER} // Usa TestIds per test, sostituiscilo con il tuo unitId in produzione
                size={BannerAdSize.BANNER}
            />
        </View>
    );
};
