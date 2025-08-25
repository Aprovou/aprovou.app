import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';

interface LogoProps {
  size?: number;
  variant?: 'light' | 'dark';
  withBackground?: boolean;
}

export function Logo({ size = 80, variant = 'dark', withBackground = true }: LogoProps) {
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
    },
    circle: {
      width: '100%',
      height: '100%',
      borderRadius: size / 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    innerCircle: {
      width: '92%',
      height: '92%',
      borderRadius: (size / 2) * 0.92,
      backgroundColor: variant === 'dark' ? '#000' : '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    plainLogo: {
      alignItems: 'center',
      justifyContent: 'center',
    }
  });

  const LogoSvg = () => (
    <Svg width={size * 0.6} height={size * 0.6 * 0.728} viewBox="0 0 95.52 69.54">
      <Path
        d="M71.1,28.39,59.63,47.15a1.25,1.25,0,0,1-2.13,0L55.27,43.5a1.25,1.25,0,0,0-2-.19L39.51,58.72a1.25,1.25,0,0,1-2-1.49L52.78,32.37a1.25,1.25,0,0,1,2.13,0l1.64,2.68a1.25,1.25,0,0,0,2.14,0L62,29.65a1.22,1.22,0,0,0,0-1.3L45.45,1.26a1.25,1.25,0,0,0-2.14,0L2.43,68.3a1.25,1.25,0,0,0,1.06,1.9h93a1.25,1.25,0,0,0,1.06-1.9L73.23,28.39A1.25,1.25,0,0,0,71.1,28.39Z"
        fill={variant === 'dark' ? '#fff' : '#000'}
      />
    </Svg>
  );

  if (!withBackground) {
    return (
      <View style={[styles.container, styles.plainLogo]}>
        <LogoSvg />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#74f787', '#f3ff7d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.circle}
      >
        <View style={styles.innerCircle}>
          <LogoSvg />
        </View>
      </LinearGradient>
    </View>
  );
}