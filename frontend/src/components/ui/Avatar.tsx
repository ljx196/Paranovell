/**
 * GenNovel Design System - Avatar Component
 * Circular avatar with sm/md/lg sizes
 */

import React from 'react';
import { View, Text, Image, ViewStyle, TextStyle, ImageSourcePropType } from 'react-native';
import { useTheme } from '../../theme';

export type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  name?: string;
  source?: ImageSourcePropType;
  size?: AvatarSize;
  style?: ViewStyle;
}

const sizeMap: Record<AvatarSize, { container: number; font: number }> = {
  sm: { container: 28, font: 12 },
  md: { container: 36, font: 14 },
  lg: { container: 48, font: 18 },
};

export function Avatar({
  name,
  source,
  size = 'md',
  style,
}: AvatarProps) {
  const { colors, borderRadius } = useTheme();
  const dimensions = sizeMap[size];

  const containerStyle: ViewStyle = {
    width: dimensions.container,
    height: dimensions.container,
    borderRadius: dimensions.container / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const textStyle: TextStyle = {
    color: '#FFFFFF',
    fontSize: dimensions.font,
    fontWeight: '600',
  };

  const getInitial = (text?: string): string => {
    if (!text) return 'U';
    return text.charAt(0).toUpperCase();
  };

  if (source) {
    return (
      <View style={[containerStyle, style]}>
        <Image
          source={source}
          style={{
            width: dimensions.container,
            height: dimensions.container,
          }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      <Text style={textStyle}>{getInitial(name)}</Text>
    </View>
  );
}

export default Avatar;
