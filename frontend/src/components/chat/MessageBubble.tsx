/**
 * GenNovel Design System - Message Bubble Component
 * No avatar, color differentiation for user/AI messages
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ViewStyle,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';

export type MessageRole = 'user' | 'assistant';

export interface MessageImage {
  uri: string;
  width?: number;
  height?: number;
}

interface MessageBubbleProps {
  role: MessageRole;
  content: string;
  images?: MessageImage[];
  style?: ViewStyle;
}

interface ImageWithZoomProps {
  image: MessageImage;
  borderRadius: number;
  onPress: () => void;
}

function ImageWithZoom({ image, borderRadius, onPress }: ImageWithZoomProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setIsHovered(true)}
      onHoverOut={() => setIsHovered(false)}
      style={[
        styles.imageWrapper,
        {
          borderRadius,
          cursor: 'zoom-in',
        } as any,
      ]}
    >
      <Image
        source={{ uri: image.uri }}
        style={[
          styles.image,
          {
            borderRadius,
            width: image.width || 300,
            height: image.height || 200,
            maxWidth: '100%',
          },
        ]}
        resizeMode="cover"
        accessibilityLabel="消息图片"
      />
      {/* Zoom indicator - transparent style */}
      {isHovered && (
        <View style={[styles.zoomIndicator, { borderRadius: borderRadius / 2 }]}>
          <View style={styles.zoomIconInner}>
            <View style={styles.zoomCircle} />
            <View style={styles.zoomHandle} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function MessageBubble({ role, content, images, style }: MessageBubbleProps) {
  const { colors, layout, typography, borderRadius, messagePadding, isDark } = useTheme();
  const { isMobile } = useResponsive();
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null);

  const isUser = role === 'user';
  const paddingX = isMobile ? messagePadding.mobile.horizontal : messagePadding.desktop.horizontal;

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isUser
            ? colors.msgUserBg
            : (!isDark ? colors.bgTertiary : colors.msgAiBg),
          paddingHorizontal: paddingX,
        },
        style,
      ]}
    >
      <View style={[styles.inner, { maxWidth: layout.contentMaxWidth }]}>
        {/* Images */}
        {images && images.length > 0 && (
          <View style={styles.imagesContainer}>
            {images.map((img, index) => (
              <ImageWithZoom
                key={index}
                image={img}
                borderRadius={borderRadius.lg}
                onPress={() => setSelectedImage(img)}
              />
            ))}
          </View>
        )}

        {/* Text content */}
        {content && (
          <Text
            style={[
              styles.content,
              {
                color: isUser ? colors.textPrimary : colors.textSecondary,
                fontSize: typography.body.fontSize,
                lineHeight: typography.body.lineHeight,
              },
            ]}
          >
            {content}
          </Text>
        )}
      </View>

      {/* Image Lightbox Modal */}
      <Modal
        visible={!!selectedImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.9)' }]}
          onPress={() => setSelectedImage(null)}
        >
          {/* Close button */}
          <Pressable
            style={[styles.closeButton, { right: isMobile ? 16 : 40 }]}
            onPress={() => setSelectedImage(null)}
            accessibilityLabel="关闭图片预览"
          >
            <X size={20} color="#FFFFFF" />
          </Pressable>

          {/* Full size image */}
          {selectedImage && (
            <Image
              source={{ uri: selectedImage.uri }}
              style={{
                width: Math.min(screenWidth * 0.9, (selectedImage.width || 800)),
                height: Math.min(screenHeight * 0.8, (selectedImage.height || 600)),
                borderRadius: borderRadius.lg,
              }}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  imageWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    maxWidth: '100%',
  },
  zoomIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomIconInner: {
    position: 'relative',
    width: 16,
    height: 16,
  },
  zoomCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'transparent',
  },
  zoomHandle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 6,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transform: [{ rotate: '45deg' }],
  },
  content: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  } as any,
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    cursor: 'pointer',
  } as any,
});

export default MessageBubble;
