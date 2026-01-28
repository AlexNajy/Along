import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
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
    secondary: 'bg-secondary-50 active:bg-secondary-100',
    outline: 'bg-transparent border-2 border-primary-500 active:bg-primary-50',
    danger: 'bg-red-50 active:bg-red-100',
    ghost: 'bg-transparent active:bg-primary-50',
  };


  const textStyles = {
    primary: 'text-primary-700',
    secondary: 'text-secondary-500',
    outline: 'text-primary-500',
    danger: 'text-danger',
    ghost: 'text-primary-500',
  };


  const sizeStyles = {
    small: 'px-4 py-2',
    medium: 'px-6 py-3',
    large: 'px-8 py-4',
  };

  const textSizeStyles = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };


  const disabledStyle = disabled || loading ? 'opacity-50' : '';
  const widthStyle = fullWidth ? 'w-full' : '';

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