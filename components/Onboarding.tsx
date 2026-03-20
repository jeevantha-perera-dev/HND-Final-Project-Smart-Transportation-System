import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import OnboardingSlide from "./onboarding/OnboardingSlide";
import PaginationDots from "./onboarding/PaginationDots";
import AnimatedButton from "./onboarding/AnimatedButton";

const { width } = Dimensions.get("window");

const ONBOARDING_DATA = [
  {
    id: "1",
    title: "Smart Bus Tracking",
    subtitle: "Track your bus in real-time with accuracy",
    icon: "bus-outline" as const,
    backgroundImage:
      "https://images.unsplash.com/photo-1519501025264-65ba15a82390?q=70&w=1400&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Easy Ticket Access",
    subtitle: "Access QR tickets instantly anytime",
    icon: "qr-code-outline" as const,
    backgroundImage:
      "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=70&w=1400&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Stay Notified",
    subtitle: "Get updates about delays and route changes",
    icon: "notifications-outline" as const,
    backgroundImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=70&w=1400&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "Rate Your Journey",
    subtitle: "Share feedback and improve your experience",
    icon: "star-outline" as const,
    backgroundImage:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=70&w=1400&auto=format&fit=crop",
  },
];

export default function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList<(typeof ONBOARDING_DATA)[number]>>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const scrollToNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      slidesRef.current?.scrollToOffset({
        offset: (currentIndex + 1) * width,
        animated: true,
      });
    } else {
      onFinish();
    }
  };

  return (
    <LinearGradient colors={["#0B1730", "#060A14"]} style={styles.container}>
      <Pressable style={styles.skipBtn} onPress={onFinish}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <Animated.FlatList
        data={ONBOARDING_DATA}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        ref={slidesRef}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <OnboardingSlide
              title={item.title}
              subtitle={item.subtitle}
              icon={item.icon}
              backgroundImage={item.backgroundImage}
            />
          </View>
        )}
      />

      <View style={styles.footer}>
        <PaginationDots
          count={ONBOARDING_DATA.length}
          scrollX={scrollX}
          width={width}
        />

        <View style={styles.buttonWrap}>
          <AnimatedButton
            label={currentIndex === ONBOARDING_DATA.length - 1 ? "Get Started" : "Next →"}
            onPress={scrollToNext}
          />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: { position: "absolute", top: 50, right: 25, zIndex: 10 },
  skipText: { color: "#A8BCD4", fontSize: 16, fontWeight: "600" },
  slide: {
    width: width,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 86,
    paddingBottom: 74,
  },
  footer: { position: "absolute", bottom: 42, width: "100%" },
  buttonWrap: { marginHorizontal: 24 },
});
