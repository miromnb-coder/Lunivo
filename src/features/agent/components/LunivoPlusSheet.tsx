import Ionicons from '@expo/vector-icons/Ionicons';
import * as MediaLibrary from 'expo-media-library';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { lunivoHaptics } from '../../../shared/haptics/lunivoHaptics';
import { agentTheme } from '../constants/agentTheme';
import type { LunivoAttachment } from '../types/attachments';

type LunivoPlusSheetProps = {
  visible: boolean;
  onAddPhotos?: (photos: LunivoAttachment[]) => void;
  onClose: () => void;
  onSelectPrompt?: (prompt: string) => void;
};

type RecentPhoto = {
  id: string;
  uri: string;
};

type StudyTool = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  prompt: string;
};

const SHEET_BACKGROUND = '#fbfbfa';
const ICON_COLOR = 'rgba(31,36,48,0.76)';
const MUTED_ICON_COLOR = 'rgba(115,115,130,0.72)';
const DIVIDER_COLOR = 'rgba(31,36,48,0.075)';
const SELECTION_BLUE = '#0A84FF';
const MAX_SELECTED_PHOTOS = 5;

const CLOSE_DISTANCE = 88;
const CLOSE_VELOCITY = 0.85;
const DRAG_ACTIVATION_DISTANCE = 7;
const HIDDEN_SHEET_HEIGHT_RATIO = 0.82;
const HIDDEN_SHEET_EXTRA_OFFSET = 90;

const OPEN_SPRING_CONFIG = {
  damping: 25,
  stiffness: 230,
  mass: 0.9,
  overshootClamping: true,
  restDisplacementThreshold: 0.5,
  restSpeedThreshold: 0.5,
  useNativeDriver: true,
} as const;

const STUDY_TOOLS: StudyTool[] = [
  {
    icon: 'scan-outline',
    label: 'Explain from image',
    prompt: 'Explain this image clearly step by step: ',
  },
  {
    icon: 'list-outline',
    label: 'Summarize notes',
    prompt: 'Summarize these notes into clear study points: ',
  },
  {
    icon: 'help-circle-outline',
    label: 'Create quiz',
    prompt: 'Create a short quiz about this topic: ',
  },
  {
    icon: 'albums-outline',
    label: 'Make flashcards',
    prompt: 'Make flashcards for this topic: ',
  },
  {
    icon: 'calendar-outline',
    label: 'Study plan',
    prompt: 'Make me a study plan for: ',
  },
  {
    icon: 'timer-outline',
    label: 'Focus session',
    prompt: 'Help me start a focused study session for: ',
  },
];

function isRenderableImageUri(uri?: string | null) {
  if (!uri) {
    return false;
  }

  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('asset://') ||
    uri.startsWith('data:') ||
    uri.startsWith('http://') ||
    uri.startsWith('https://')
  );
}

export function LunivoPlusSheet({ visible, onAddPhotos, onClose, onSelectPrompt }: LunivoPlusSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const dragTranslateY = useRef(new Animated.Value(0)).current;
  const ctaTranslateY = useRef(new Animated.Value(120)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const scrollYRef = useRef(0);
  const sheetScrollRef = useRef<ScrollView | null>(null);
  const photoStripScrollRef = useRef<ScrollView | null>(null);
  const [recentPhotos, setRecentPhotos] = useState<RecentPhoto[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);

  const selectedPhotos = useMemo(
    () => selectedPhotoIds
      .map((photoId) => recentPhotos.find((photo) => photo.id === photoId))
      .filter((photo): photo is RecentPhoto => photo !== undefined),
    [recentPhotos, selectedPhotoIds],
  );
  const selectedPhotoCount = selectedPhotos.length;

  function resetScrollPositions() {
    scrollYRef.current = 0;
    sheetScrollRef.current?.scrollTo({ y: 0, animated: false });
    photoStripScrollRef.current?.scrollTo({ x: 0, animated: false });
  }

  useEffect(() => {
    if (visible) {
      lunivoHaptics.openDrawer();
      dragTranslateY.setValue(0);
      setSelectedPhotoIds([]);
      resetScrollPositions();
      loadRecentPhotos();

      Animated.spring(progress, {
        toValue: 1,
        ...OPEN_SPRING_CONFIG,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 175,
      easing: Easing.bezier(0.36, 0, 0.2, 1),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        dragTranslateY.setValue(0);
        setSelectedPhotoIds([]);
        resetScrollPositions();
      }
    });
  }, [dragTranslateY, progress, visible]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(ctaOpacity, {
        toValue: selectedPhotoCount > 0 ? 1 : 0,
        duration: 170,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(ctaTranslateY, {
        toValue: selectedPhotoCount > 0 ? 0 : 120,
        damping: 22,
        stiffness: 260,
        mass: 0.85,
        useNativeDriver: true,
      }),
    ]).start();
  }, [ctaOpacity, ctaTranslateY, selectedPhotoCount]);

  async function loadRecentPhotos() {
    try {
      const currentPermission = await MediaLibrary.getPermissionsAsync();
      let hasPermission = currentPermission.granted;

      if (!hasPermission && currentPermission.canAskAgain) {
        const requestedPermission = await MediaLibrary.requestPermissionsAsync();
        hasPermission = requestedPermission.granted;
      }

      if (!hasPermission) {
        setRecentPhotos([]);
        return;
      }

      const result = await MediaLibrary.getAssetsAsync({
        first: 12,
        mediaType: MediaLibrary.MediaType.photo,
      });

      const photos = await Promise.all(
        result.assets.map(async (asset) => {
          try {
            const assetInfo = await MediaLibrary.getAssetInfoAsync(asset);
            const uri = isRenderableImageUri(assetInfo.localUri) ? assetInfo.localUri : asset.uri;

            if (!isRenderableImageUri(uri)) {
              return null;
            }

            return {
              id: asset.id,
              uri,
            } satisfies RecentPhoto;
          } catch {
            return null;
          }
        }),
      );

      setRecentPhotos(photos.filter((photo): photo is RecentPhoto => photo !== null));
    } catch {
      setRecentPhotos([]);
    }
  }

  function closeSheet() {
    lunivoHaptics.closeDrawer();
    onClose();
  }

  function selectPrompt(prompt: string) {
    lunivoHaptics.selectConversation();
    onSelectPrompt?.(prompt);
    onClose();
  }

  function togglePhoto(photo: RecentPhoto) {
    setSelectedPhotoIds((currentIds) => {
      if (currentIds.includes(photo.id)) {
        lunivoHaptics.selectConversation();
        return currentIds.filter((photoId) => photoId !== photo.id);
      }

      if (currentIds.length >= MAX_SELECTED_PHOTOS) {
        lunivoHaptics.error();
        return currentIds;
      }

      lunivoHaptics.selectConversation();
      return [...currentIds, photo.id];
    });
  }

  function addSelectedPhotos() {
    if (selectedPhotos.length === 0) {
      return;
    }

    lunivoHaptics.newChat();
    onAddPhotos?.(
      selectedPhotos.map((photo) => ({
        id: photo.id,
        type: 'photo',
        uri: photo.uri,
      })),
    );
    onClose();
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_, gesture) => {
          const isAtTop = scrollYRef.current <= 0;
          const isPullingDown = gesture.dy > DRAG_ACTIVATION_DISTANCE;
          const isMostlyVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2;

          return visible && isAtTop && isPullingDown && isMostlyVertical;
        },
        onMoveShouldSetPanResponder: (_, gesture) => {
          const isAtTop = scrollYRef.current <= 0;
          const isPullingDown = gesture.dy > DRAG_ACTIVATION_DISTANCE;
          const isMostlyVertical = Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.2;

          return visible && isAtTop && isPullingDown && isMostlyVertical;
        },
        onPanResponderMove: (_, gesture) => {
          dragTranslateY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldClose = gesture.dy > CLOSE_DISTANCE || gesture.vy > CLOSE_VELOCITY;

          if (shouldClose) {
            closeSheet();
            return;
          }

          Animated.spring(dragTranslateY, {
            toValue: 0,
            tension: 95,
            friction: 13,
            useNativeDriver: true,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragTranslateY, {
            toValue: 0,
            tension: 95,
            friction: 13,
            useNativeDriver: true,
          }).start();
        },
      }),
    [dragTranslateY, onClose, visible],
  );

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.47],
  });
  const hiddenTranslateY = height * HIDDEN_SHEET_HEIGHT_RATIO + HIDDEN_SHEET_EXTRA_OFFSET;
  const baseTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [hiddenTranslateY, 0],
  });
  const sheetTranslateY = Animated.add(baseTranslateY, dragTranslateY);

  return (
    <View pointerEvents={visible ? 'auto' : 'none'} style={styles.root}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable onPress={closeSheet} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sheet,
          {
            paddingBottom: Math.max(insets.bottom + 8, 24),
            transform: [{ translateY: sheetTranslateY }],
          },
        ]}
      >
        <View style={styles.handle} />

        <ScrollView
          ref={sheetScrollRef}
          bounces={false}
          contentContainerStyle={[styles.scrollContent, selectedPhotoCount > 0 && styles.scrollContentWithCta]}
          keyboardShouldPersistTaps="handled"
          onScroll={(event) => {
            scrollYRef.current = Math.max(0, event.nativeEvent.contentOffset.y);
          }}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.photosHeader}>
            <Text allowFontScaling={false} style={styles.photosTitle}>
              Photos
            </Text>
            <Pressable hitSlop={12} onPress={() => selectPrompt('I want to use a photo for studying: ')}>
              <Text allowFontScaling={false} style={styles.seeAllText}>
                See all
              </Text>
            </Pressable>
          </View>

          <ScrollView
            ref={photoStripScrollRef}
            bounces
            contentContainerStyle={styles.photoStripContent}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            <CameraCard onPress={() => selectPrompt('I want to take a photo and study from it: ')} />
            {recentPhotos.length > 0 ? (
              recentPhotos.map((photo) => {
                const selectedIndex = selectedPhotoIds.indexOf(photo.id);

                return (
                  <PhotoCard
                    key={photo.id}
                    uri={photo.uri}
                    selected={selectedIndex !== -1}
                    selectedIndex={selectedIndex + 1}
                    onPress={() => togglePhoto(photo)}
                  />
                );
              })
            ) : (
              <>
                <PlaceholderPhotoCard />
                <PlaceholderPhotoCard variant="diagram" />
                <PlaceholderPhotoCard variant="highlight" />
              </>
            )}
          </ScrollView>

          <View style={styles.divider} />

          <SectionLabel label="Files" />
          <ActionRow
            icon="document-text-outline"
            label="Add files"
            onPress={() => selectPrompt('I want to add a file for studying: ')}
          />

          <View style={styles.divider} />

          <SectionLabel label="Study tools" />
          <View style={styles.studyToolsList}>
            {STUDY_TOOLS.map((tool) => (
              <ActionRow
                key={tool.label}
                icon={tool.icon}
                label={tool.label}
                onPress={() => selectPrompt(tool.prompt)}
                separated
              />
            ))}
          </View>
        </ScrollView>

        <Animated.View
          pointerEvents={selectedPhotoCount > 0 ? 'auto' : 'none'}
          style={[
            styles.ctaWrap,
            {
              bottom: Math.max(insets.bottom + 11, 22),
              opacity: ctaOpacity,
              transform: [{ translateY: ctaTranslateY }],
            },
          ]}
        >
          <Pressable
            accessibilityLabel={`Add ${selectedPhotoCount} photo${selectedPhotoCount === 1 ? '' : 's'}`}
            accessibilityRole="button"
            onPress={addSelectedPhotos}
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
          >
            <Text allowFontScaling={false} style={styles.ctaText}>
              Add {selectedPhotoCount} photo{selectedPhotoCount === 1 ? '' : 's'}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text allowFontScaling={false} style={styles.sectionLabel}>
      {label}
    </Text>
  );
}

function CameraCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Camera"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.cameraCard, pressed && styles.pressed]}
    >
      <Ionicons name="camera-outline" size={35} color={ICON_COLOR} />
      <Text allowFontScaling={false} style={styles.cameraLabel}>
        Camera
      </Text>
    </Pressable>
  );
}

function PhotoCard({
  uri,
  selected,
  selectedIndex,
  onPress,
}: {
  uri: string;
  selected: boolean;
  selectedIndex: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel="Recent photo"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.photoCard,
        selected && styles.photoCardSelected,
        pressed && styles.pressed,
      ]}
    >
      <Image source={{ uri }} style={styles.photoImage} />
      {selected ? (
        <>
          <View style={styles.selectedPhotoOverlay} />
          <View style={styles.selectedBadge}>
            <Text allowFontScaling={false} style={styles.selectedBadgeText}>
              {selectedIndex}
            </Text>
          </View>
        </>
      ) : null}
    </Pressable>
  );
}

function PlaceholderPhotoCard({ variant = 'notes' }: { variant?: 'notes' | 'diagram' | 'highlight' }) {
  return (
    <View style={styles.placeholderCard}>
      <View style={styles.placeholderPage}>
        <View style={[styles.placeholderLine, variant === 'highlight' && styles.placeholderHighlight]} />
        <View style={styles.placeholderLineShort} />
        <View style={styles.placeholderLine} />
        {variant === 'diagram' ? <View style={styles.placeholderDiagram} /> : null}
        <View style={styles.placeholderLineTiny} />
        <View style={styles.placeholderLine} />
      </View>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  separated = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  separated?: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        separated && styles.actionRowSeparated,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.actionIconSlot}>
        <Ionicons name={icon} size={28} color={MUTED_ICON_COLOR} />
      </View>
      <Text allowFontScaling={false} style={styles.actionLabel}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111111',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '76%',
    borderTopLeftRadius: 38,
    borderTopRightRadius: 38,
    backgroundColor: SHEET_BACKGROUND,
    shadowColor: '#111827',
    shadowOpacity: 0.14,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: -14 },
    elevation: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 60,
    height: 7,
    borderRadius: 999,
    marginTop: 17,
    marginBottom: 27,
    backgroundColor: 'rgba(31,36,48,0.28)',
  },
  scrollContent: {
    paddingBottom: 10,
  },
  scrollContentWithCta: {
    paddingBottom: 108,
  },
  photosHeader: {
    paddingHorizontal: 22,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photosTitle: {
    color: agentTheme.colors.text,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  seeAllText: {
    color: '#6f687d',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    letterSpacing: -0.12,
  },
  photoStripContent: {
    paddingLeft: 22,
    paddingRight: 22,
    gap: 14,
  },
  cameraCard: {
    width: 132,
    height: 158,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f6f4',
    borderWidth: 1,
    borderColor: 'rgba(31,36,48,0.055)',
    shadowColor: '#d7d6df',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  cameraLabel: {
    marginTop: 17,
    color: agentTheme.colors.text,
    fontSize: 14.5,
    lineHeight: 19,
    fontWeight: '600',
    letterSpacing: -0.12,
  },
  photoCard: {
    width: 132,
    height: 158,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#f0efec',
    borderWidth: 1,
    borderColor: 'rgba(31,36,48,0.065)',
  },
  photoCardSelected: {
    borderWidth: 4,
    borderColor: SELECTION_BLUE,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectedPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    shadowColor: '#111827',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  selectedBadgeText: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '800',
  },
  placeholderCard: {
    width: 132,
    height: 158,
    borderRadius: 25,
    overflow: 'hidden',
    padding: 12,
    backgroundColor: '#f0efec',
    borderWidth: 1,
    borderColor: 'rgba(31,36,48,0.065)',
  },
  placeholderPage: {
    flex: 1,
    borderRadius: 17,
    padding: 12,
    backgroundColor: '#fbfaf6',
    transform: [{ rotate: '-2deg' }],
  },
  placeholderLine: {
    height: 5,
    borderRadius: 999,
    marginBottom: 9,
    backgroundColor: 'rgba(115,115,130,0.28)',
  },
  placeholderLineShort: {
    width: '72%',
    height: 5,
    borderRadius: 999,
    marginBottom: 9,
    backgroundColor: 'rgba(115,115,130,0.22)',
  },
  placeholderLineTiny: {
    width: '54%',
    height: 5,
    borderRadius: 999,
    marginBottom: 9,
    backgroundColor: 'rgba(115,115,130,0.2)',
  },
  placeholderHighlight: {
    backgroundColor: 'rgba(219,183,97,0.45)',
  },
  placeholderDiagram: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(115,115,130,0.24)',
    marginBottom: 9,
  },
  divider: {
    height: 1,
    marginHorizontal: 22,
    marginTop: 22,
    marginBottom: 19,
    backgroundColor: DIVIDER_COLOR,
  },
  sectionLabel: {
    paddingHorizontal: 22,
    marginBottom: 10,
    color: agentTheme.colors.mutedText,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.22,
  },
  actionRow: {
    minHeight: 60,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRowSeparated: {
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER_COLOR,
  },
  actionIconSlot: {
    width: 56,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  actionLabel: {
    flex: 1,
    color: agentTheme.colors.text,
    fontSize: 17.5,
    lineHeight: 23,
    fontWeight: '500',
    letterSpacing: -0.22,
  },
  studyToolsList: {
    marginBottom: 8,
  },
  ctaWrap: {
    position: 'absolute',
    left: 28,
    right: 28,
  },
  ctaButton: {
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050505',
    shadowColor: '#111827',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  ctaButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '700',
    letterSpacing: -0.22,
  },
  pressed: {
    opacity: 0.58,
  },
});
