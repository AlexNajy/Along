import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

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
  

  const containerStyles = {
    primary: 'bg-primary-100 active:bg-primary-50',
    solid: 'bg-primary-600 active:bg-primary-50',
    secondary: 'bg-secondary-50 active:bg-secondary-100',
    outline: 'bg-transparent border-2 border-primary-500 active:bg-primary-50',
    danger: 'bg-red-50 active:bg-red-100',
    ghost: 'bg-transparent active:bg-primary-50',
  };


  const textStyles = {
    primary: 'text-primary-700',
    secondary: 'text-secondary-500',
    solid: 'text-surface',
    outline: 'text-primary-500',
    danger: 'text-danger',
    ghost: 'text-primary-500',
  };


  const sizeStyles = {
    small: 'px-4 py-2',
    medium: 'px-6 py-3',
    large: 'px-8 py-4',
    solid: 'px-10 py-4'
  };

  const textSizeStyles = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    solid: 'text-lg'
  };


  const disabledStyle = disabled || loading ? 'opacity-50' : '';
  const widthStyle = fullWidth ? 'w-full' : 'w-64';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`
        ${containerStyles[variant]}
        ${sizeStyles[size]}
        ${disabledStyle}
        ${widthStyle}
        rounded-button
        flex-row
        items-center
        justify-center
      `}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? '#14b8ad' : variant === 'secondary' ? '#1a8cff' : variant === 'danger' ? '#F75555' : '#14b8ad'} 
        />
      ) : (
        <>
          {icon && <View className="mr-2">{icon}</View>}
          <Text className={`
            ${textStyles[variant]}
            ${textSizeStyles[size]}
            font-rubikSemiBold
            text-center
          `}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}