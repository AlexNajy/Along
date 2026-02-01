import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'solid' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large' | 'solid';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
}: ButtonProps) {
  const { colors } = useTheme();

  const getContainerStyle = () => {
    const baseStyle = {
      borderRadius: 12,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };

    const variantStyles = {
      primary: { backgroundColor: colors.primary[100] },
      solid: { backgroundColor: colors.primary[500] },
      secondary: { backgroundColor: colors.secondary[50] },
      outline: { 
        backgroundColor: 'transparent', 
        borderWidth: 2, 
        borderColor: colors.primary[500] 
      },
      danger: { 
        backgroundColor: 'transparent', 
        borderWidth: 2, 
        borderColor: colors.danger 
      },
      ghost: { backgroundColor: 'transparent' },
    };

    return { ...baseStyle, ...variantStyles[variant] };
  };

  const getTextColor = () => {
    const textColors = {
      primary: colors.primary[700],
      secondary: colors.secondary[500],
      solid: colors.surface.primary,
      outline: colors.primary[500],
      danger: colors.danger,
      ghost: colors.primary[500],
    };
    return textColors[variant];
  };

  // Size styles
  const getSizeStyle = () => {
    const sizes = {
      small: { paddingHorizontal: 16, paddingVertical: 8 },
      medium: { paddingHorizontal: 24, paddingVertical: 12 },
      large: { paddingHorizontal: 32, paddingVertical: 16 },
      solid: { paddingHorizontal: 40, paddingVertical: 16 },
    };
    return sizes[size];
  };

  const getTextSize = () => {
    const sizes = {
      small: 14,
      medium: 16,
      large: 18,
      solid: 18,
    };
    return sizes[size];
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        getContainerStyle(),
        getSizeStyle(),
        fullWidth && { width: '100%' },
        (disabled || loading) && { opacity: 0.5 },
      ]}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={
            variant === 'primary' ? colors.primary[500] : 
            variant === 'secondary' ? colors.secondary[500] : 
            variant === 'danger' ? colors.danger : 
            colors.primary[500]
          } 
        />
      ) : (
        <>
          {icon && <View style={{ marginRight: 8 }}>{icon}</View>}
          <Text 
            style={{
              color: getTextColor(),
              fontSize: getTextSize(),
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}