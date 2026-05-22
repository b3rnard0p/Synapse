import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ticket, Star, MessageSquare, PartyPopper } from 'lucide-react-native';
import { useThemeStore } from '@/stores/theme.store';
import { Colors } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    image: require('../../../assets/LogoSynapse.png'),
  },
  {
    id: '2',
    title: 'Ingressos com desconto',
    subtitle: 'Compre antecipado e garanta 20% off em qualquer sessão.',
    icon: <Ticket size={80} color="#be123c" />,
  },
  {
    id: '3',
    title: 'Acumule pontos',
    subtitle: 'Cada visita ao cinema gera pontos para trocar por recompensas.',
    icon: <Star size={80} color="#FFD700" fill="#FFD700" />,
  },
  {
    id: '4',
    title: 'Sua opinião importa',
    subtitle: 'Participe de pesquisas e ganhe recompensas.',
    icon: <MessageSquare size={80} color="#be123c" />,
  },
  {
    id: '5',
    title: 'Comece agora',
    subtitle: 'Faça login ou cadastre-se para começar.',
    icon: <PartyPopper size={80} color="#be123c" />,
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { theme } = useThemeStore();
  const c = Colors[theme];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      router.push('/(auth)/login');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
      >
        {slides.map((slide) => (
          <LinearGradient key={slide.id} colors={[c.background, c.backgroundSecondary]} style={styles.slide}>
            {slide.image ? (
              <Image source={slide.image} style={styles.logoImage} resizeMode="contain" />
            ) : slide.icon ? (
              <View style={{ marginBottom: 32 }}>{slide.icon}</View>
            ) : null}
            <Text style={[styles.title, { color: c.text }]}>{slide.title}</Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>{slide.subtitle}</Text>
          </LinearGradient>
        ))}
      </Animated.ScrollView>

      {/* Pagination dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });
          return (
            <Animated.View key={index} style={[styles.dot, { width: dotWidth, opacity }]} />
          );
        })}
      </View>

      {/* CTA Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#be123c', '#9f1239']} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>Começar agora</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 200,
  },
  logoImage: { width: 300, height: 300, marginBottom: 0 },
  emoji: { fontSize: 80, marginBottom: 32 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 180,
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#be123c',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
  },
  button: { borderRadius: 16, overflow: 'hidden' },
  buttonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
});
